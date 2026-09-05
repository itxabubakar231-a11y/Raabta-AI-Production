"""
Raabta AI - Production Database Layer
Connects to MongoDB (raabta_ai database) when MONGODB_URI is provided and reachable.
Provides an automated resilient persistent document store fallback for local development,
testing, and serverless edge environments without MongoDB installed.
"""

import os
import json
import uuid
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

try:
    from pymongo import MongoClient
    from pymongo.collection import Collection
    from pymongo.database import Database
    from bson import ObjectId
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False
    ObjectId = None


def serialize_doc(doc: Any) -> Any:
    """Recursively serializes MongoDB documents / dicts for JSON responses."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for k, v in doc.items():
            if k == "_id":
                result["id"] = str(v)
                result["_id"] = str(v)
            elif isinstance(v, (datetime,)):
                result[k] = v.isoformat()
            elif hasattr(v, "__str__") and type(v).__name__ == "ObjectId":
                result[k] = str(v)
            elif isinstance(v, (dict, list)):
                result[k] = serialize_doc(v)
            else:
                result[k] = v
        return result
    if hasattr(doc, "__str__") and type(doc).__name__ == "ObjectId":
        return str(doc)
    if isinstance(doc, datetime):
        return doc.isoformat()
    return doc


def _get_nested(doc: Any, key: str) -> Any:
    """Safely retrieves a value from a nested dict using dot notation."""
    if not doc or not isinstance(doc, dict):
        return None
    if "." in key:
        parts = key.split(".")
        curr = doc
        for p in parts:
            if isinstance(curr, dict):
                curr = curr.get(p)
            else:
                return None
        return curr
    return doc.get(key)


class ResilientCursor:
    """Emulates a PyMongo cursor over an in-memory or persisted list of dicts."""

    def __init__(self, items: List[Dict[str, Any]]):
        self._items = [dict(item) for item in items]
        self._sort_key = None
        self._sort_reverse = False
        self._limit = None
        self._skip = 0

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, list):
            if key_or_list:
                k, d = key_or_list[0]
                self._sort_key = k
                self._sort_reverse = (d == -1)
        elif isinstance(key_or_list, str):
            self._sort_key = key_or_list
            self._sort_reverse = (direction == -1)
        return self

    def skip(self, n: int):
        self._skip = max(0, n)
        return self

    def limit(self, n: int):
        self._limit = max(0, n)
        return self

    def _execute(self) -> List[Dict[str, Any]]:
        results = list(self._items)
        if self._sort_key:
            def sort_val(doc):
                v = _get_nested(doc, self._sort_key)
                if v is None:
                    return -1e9 if self._sort_reverse else 1e9
                try:
                    return float(v)
                except (ValueError, TypeError):
                    return str(v)
            results.sort(key=sort_val, reverse=self._sort_reverse)
        if self._skip:
            results = results[self._skip:]
        if self._limit is not None:
            results = results[:self._limit]
        return results

    def __iter__(self):
        return iter(self._execute())

    def __len__(self):
        return len(self._execute())


class ResilientCollection:
    """
    Emulates a PyMongo collection with file-backed persistence.
    Works seamlessly without needing a local mongod daemon.
    """

    def __init__(self, name: str, storage_path: str):
        self.name = name
        self.storage_path = storage_path
        self.file_path = os.path.join(storage_path, f"{name}.json")
        self._docs: Dict[str, Dict[str, Any]] = {}
        self._load()

    def _load(self):
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    items = json.load(f)
                    self._docs = {str(d.get("_id", d.get("id", idx))): d for idx, d in enumerate(items)}
            except Exception:
                self._docs = {}

    def _save(self):
        try:
            os.makedirs(self.storage_path, exist_ok=True)
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(list(self._docs.values()), f, default=str, indent=2)
        except Exception:
            pass

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True
        for qk, qv in query.items():
            if (qk == "_id" or qk == "id") and not isinstance(qv, dict):
                doc_id = str(doc.get("_id", doc.get("id", "")))
                target_id = str(qv)
                if doc_id != target_id:
                    return False
                continue

            doc_val = str(doc.get("_id", doc.get("id", ""))) if (qk == "_id" or qk == "id") else _get_nested(doc, qk)
            if isinstance(qv, dict):
                # Query operators
                if "$in" in qv:
                    if doc_val not in [str(x) if (qk == "_id" or qk == "id") else x for x in qv["$in"]]:
                        return False
                elif "$nin" in qv:
                    if doc_val in [str(x) if (qk == "_id" or qk == "id") else x for x in qv["$nin"]]:
                        return False
                elif "$ne" in qv:
                    target_ne = str(qv["$ne"]) if (qk == "_id" or qk == "id") else qv["$ne"]
                    if doc_val == target_ne:
                        return False
                elif "$gte" in qv:
                    if doc_val is None or doc_val < qv["$gte"]:
                        return False
                elif "$lte" in qv:
                    if doc_val is None or doc_val > qv["$lte"]:
                        return False
                elif "$gt" in qv:
                    if doc_val is None or doc_val <= qv["$gt"]:
                        return False
                elif "$lt" in qv:
                    if doc_val is None or doc_val >= qv["$lt"]:
                        return False
                elif "$regex" in qv:
                    pattern = qv["$regex"]
                    options = qv.get("$options", "")
                    flags = re.IGNORECASE if "i" in options else 0
                    if not doc_val or not re.search(pattern, str(doc_val), flags):
                        return False
            else:
                if doc_val != qv:
                    return False
        return True

    def find(self, query: Optional[Dict[str, Any]] = None, projection=None) -> ResilientCursor:
        query = query or {}
        matched = [dict(d) for d in self._docs.values() if self._matches(d, query)]
        return ResilientCursor(matched)

    def find_one(self, query: Optional[Dict[str, Any]] = None, projection=None) -> Optional[Dict[str, Any]]:
        query = query or {}
        for d in self._docs.values():
            if self._matches(d, query):
                return dict(d)
        return None

    def insert_one(self, doc: Dict[str, Any]):
        new_doc = dict(doc)
        if "_id" not in new_doc:
            new_doc["_id"] = str(uuid.uuid4())
        if "id" not in new_doc:
            new_doc["id"] = str(new_doc["_id"])
        if "created_at" not in new_doc:
            new_doc["created_at"] = datetime.now(timezone.utc).isoformat()
        doc_id = str(new_doc["_id"])
        self._docs[doc_id] = new_doc
        self._save()

        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(new_doc["_id"])

    def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        target_id = None
        matched_doc = None

        for k, d in self._docs.items():
            if self._matches(d, query):
                target_id = k
                matched_doc = d
                break

        if not matched_doc:
            if upsert:
                new_doc = dict(query)
                if "$set" in update:
                    new_doc.update(update["$set"])
                res = self.insert_one(new_doc)
                class UpsertResult:
                    matched_count = 0
                    modified_count = 1
                    upserted_id = res.inserted_id
                return UpsertResult()
            class NoopResult:
                matched_count = 0
                modified_count = 0
                upserted_id = None
            return NoopResult()

        if "$set" in update:
            for sk, sv in update["$set"].items():
                matched_doc[sk] = sv

        if "$inc" in update:
            for ik, iv in update["$inc"].items():
                matched_doc[ik] = matched_doc.get(ik, 0) + iv

        if "$push" in update:
            for pk, pv in update["$push"].items():
                if pk not in matched_doc or not isinstance(matched_doc[pk], list):
                    matched_doc[pk] = []
                matched_doc[pk].append(pv)

        matched_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
        self._docs[target_id] = matched_doc
        self._save()

        class UpdateResult:
            matched_count = 1
            modified_count = 1
            upserted_id = None
        return UpdateResult()

    def delete_one(self, query: Dict[str, Any]):
        target_id = None
        for k, d in self._docs.items():
            if self._matches(d, query):
                target_id = k
                break
        if target_id:
            del self._docs[target_id]
            self._save()
            class DelResult:
                deleted_count = 1
            return DelResult()
        class DelZeroResult:
            deleted_count = 0
        return DelZeroResult()

    def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        query = query or {}
        return sum(1 for d in self._docs.values() if self._matches(d, query))

    def create_index(self, keys, **kwargs):
        # Indexing is simulated in-memory
        return True


class ResilientDatabase:
    """Emulates a PyMongo database container with collection attributes."""

    def __init__(self, storage_dir: str):
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
        self._collections: Dict[str, ResilientCollection] = {}

    def __getattr__(self, name: str) -> ResilientCollection:
        if name not in self._collections:
            self._collections[name] = ResilientCollection(name, self.storage_dir)
        return self._collections[name]

    def __getitem__(self, name: str) -> ResilientCollection:
        return self.__getattr__(name)


# Global database instance holder
_db_instance = None
_db_type = "uninitialized"


def get_db():
    """
    Returns the active database instance.
    Attempts MongoDB connection first, falling back gracefully to ResilientDatabase.
    """
    global _db_instance, _db_type

    if _db_instance is not None:
        return _db_instance

    mongodb_uri = os.environ.get("MONGODB_URI") or os.getenv("MONGODB_URI", "")
    db_name = os.environ.get("MONGODB_DB_NAME", "raabta_ai")

    if PYMONGO_AVAILABLE and mongodb_uri:
        try:
            client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=2000)
            # Verify connectivity
            client.admin.command('ping')
            _db_instance = client[db_name]
            _db_type = "mongodb"
            print(f"[Database] Connected successfully to MongoDB: {db_name}")
            _setup_indexes(_db_instance)
            return _db_instance
        except Exception as e:
            print(f"[Database] MongoDB connection failed ({e}). Initializing resilient document store...")

    # Fallback to persistent local document storage
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, ".data_store")
    _db_instance = ResilientDatabase(data_dir)
    _db_type = "resilient_fallback"
    print(f"[Database] Running on Resilient Document Store ({data_dir})")
    return _db_instance


def get_db_status() -> Dict[str, Any]:
    """Returns runtime database status and collection counts."""
    db = get_db()
    collections = [
        "users",
        "departments",
        "civic_reports",
        "report_events",
        "issue_clusters",
        "resolution_verifications",
        "notifications",
        "internal_notes",
        "audit_logs"
    ]
    counts = {}
    for col in collections:
        try:
            counts[col] = db[col].count_documents({})
        except Exception:
            counts[col] = 0

    return {
        "connected": True,
        "database_type": _db_type,
        "database_name": "raabta_ai",
        "collections": counts
    }


def _setup_indexes(db):
    """Sets up performance and uniqueness indexes on MongoDB collections."""
    try:
        db.users.create_index("email", unique=True)
        db.users.create_index("role")
        db.civic_reports.create_index("tracking_id", unique=True)
        db.civic_reports.create_index("status")
        db.civic_reports.create_index("civic_risk_score")
        db.civic_reports.create_index("department_id")
        db.civic_reports.create_index("cluster_id")
        db.issue_clusters.create_index("cluster_code", unique=True)
        db.notifications.create_index("user_id")
    except Exception as e:
        print(f"[Database] Index setup warning: {e}")

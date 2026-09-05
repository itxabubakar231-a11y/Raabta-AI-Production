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


def find_report(db, report_id: Any) -> Optional[Dict[str, Any]]:
    """
    Universally finds a report across MongoDB and ResilientDatabase by:
    - string _id
    - string id
    - BSON ObjectId (if valid and PyMongo available)
    - tracking_id (exact, uppercase, and case-insensitive regex)
    """
    if not report_id:
        return None

    clean_id = str(report_id).strip()
    if not clean_id:
        return None

    # 1. Direct matches
    rep = db.civic_reports.find_one({"_id": clean_id})
    if rep:
        return rep

    rep = db.civic_reports.find_one({"id": clean_id})
    if rep:
        return rep

    rep = db.civic_reports.find_one({"tracking_id": clean_id})
    if rep:
        return rep

    # 2. Uppercase tracking ID (e.g. ra-2026-3d460 -> RA-2026-3D460)
    upper_id = clean_id.upper()
    if upper_id != clean_id:
        rep = db.civic_reports.find_one({"tracking_id": upper_id})
        if rep:
            return rep

    # 3. MongoDB ObjectId conversion
    if PYMONGO_AVAILABLE and ObjectId and ObjectId.is_valid(clean_id):
        try:
            rep = db.civic_reports.find_one({"_id": ObjectId(clean_id)})
            if rep:
                return rep
        except Exception:
            pass

    # 4. Case-insensitive tracking_id search
    try:
        escaped = re.escape(clean_id)
        rep = db.civic_reports.find_one({
            "tracking_id": {"$regex": f"^{escaped}$", "$options": "i"}
        })
        if rep:
            return rep
    except Exception:
        pass

    return None


def find_user(db, identifier: Any) -> Optional[Dict[str, Any]]:
    """Universally finds a user by _id, id, email, or ObjectId."""
    if not identifier:
        return None
    clean = str(identifier).strip()
    u = db.users.find_one({"_id": clean}) or db.users.find_one({"id": clean})
    if u:
        return u
    u = db.users.find_one({"email": clean.lower()}) or db.users.find_one({"email": clean})
    if u:
        return u
    if PYMONGO_AVAILABLE and ObjectId and ObjectId.is_valid(clean):
        try:
            u = db.users.find_one({"_id": ObjectId(clean)})
            if u:
                return u
        except Exception:
            pass
    return None


def find_department(db, identifier: Any) -> Optional[Dict[str, Any]]:
    """Universally finds a department by code, _id, or case-insensitive code."""
    if not identifier:
        return None
    clean = str(identifier).strip()
    d = db.departments.find_one({"code": clean}) or db.departments.find_one({"_id": clean}) or db.departments.find_one({"id": clean})
    if d:
        return d
    upper_c = clean.upper()
    if upper_c != clean:
        d = db.departments.find_one({"code": upper_c})
        if d:
            return d
    return None


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
        self._last_mtime: float = 0.0
        self._load()

    def _check_reload(self):
        """Auto-reloads data if another worker/process modified the JSON file on disk."""
        try:
            if os.path.exists(self.file_path):
                current_mtime = os.path.getmtime(self.file_path)
                if current_mtime > self._last_mtime or not self._docs:
                    self._load()
        except Exception:
            pass

    def _load(self):
        if os.path.exists(self.file_path):
            try:
                self._last_mtime = os.path.getmtime(self.file_path)
                with open(self.file_path, "r", encoding="utf-8") as f:
                    items = json.load(f)
                    self._docs = {str(d.get("_id", d.get("id", idx))): d for idx, d in enumerate(items)}
            except Exception:
                self._docs = {}
        else:
            # Fallback to bundled data store if present (critical for serverless /tmp cold-starts)
            base_dir = os.path.dirname(os.path.abspath(__file__))
            bundled_file = os.path.join(base_dir, ".data_store", f"{self.name}.json")
            if os.path.exists(bundled_file):
                try:
                    with open(bundled_file, "r", encoding="utf-8") as f:
                        items = json.load(f)
                        self._docs = {str(d.get("_id", d.get("id", idx))): d for idx, d in enumerate(items)}
                    self._save()
                except Exception:
                    self._docs = {}
            else:
                self._docs = {}

    def _save(self):
        try:
            os.makedirs(self.storage_path, exist_ok=True)
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(list(self._docs.values()), f, default=str, indent=2)
            if os.path.exists(self.file_path):
                self._last_mtime = os.path.getmtime(self.file_path)
        except Exception:
            pass

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True
        for qk, qv in query.items():
            if qk == "$or":
                if not isinstance(qv, list) or not any(self._matches(doc, subq) for subq in qv):
                    return False
                continue
            if qk == "$and":
                if not isinstance(qv, list) or not all(self._matches(doc, subq) for subq in qv):
                    return False
                continue
            if qk == "$nor":
                if not isinstance(qv, list) or any(self._matches(doc, subq) for subq in qv):
                    return False
                continue

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
                elif "$exists" in qv:
                    expected = bool(qv["$exists"])
                    actual = doc_val is not None
                    if actual != expected:
                        return False
            else:
                if doc_val != qv:
                    return False
        return True

    def find(self, query: Optional[Dict[str, Any]] = None, projection=None) -> ResilientCursor:
        self._check_reload()
        query = query or {}
        matched = [dict(d) for d in self._docs.values() if self._matches(d, query)]
        return ResilientCursor(matched)

    def find_one(self, query: Optional[Dict[str, Any]] = None, projection=None) -> Optional[Dict[str, Any]]:
        self._check_reload()
        query = query or {}
        for d in self._docs.values():
            if self._matches(d, query):
                return dict(d)
        return None

    def insert_one(self, doc: Dict[str, Any]):
        self._check_reload()
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
        self._check_reload()
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
        self._check_reload()
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
        self._check_reload()
        query = query or {}
        return sum(1 for d in self._docs.values() if self._matches(d, query))

    def create_index(self, keys, **kwargs):
        # Indexing is simulated in-memory
        return True


class ResilientDatabase:
    """Emulates a PyMongo database container with collection attributes."""

    def __init__(self, storage_dir: str):
        self.storage_dir = storage_dir
        try:
            os.makedirs(storage_dir, exist_ok=True)
        except Exception:
            pass
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

    mongodb_uri = os.environ.get("MONGODB_URI") or os.getenv("MONGODB_URI") or os.environ.get("MONGO_URI") or os.getenv("MONGO_URI", "")
    db_name = os.environ.get("MONGODB_DB_NAME") or os.getenv("MONGODB_DB_NAME") or os.environ.get("MONGO_DB_NAME") or os.getenv("MONGO_DB_NAME", "raabta_ai")

    if PYMONGO_AVAILABLE and mongodb_uri:
        try:
            client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
            # Verify connectivity
            client.admin.command('ping')
            _db_instance = client[db_name]
            _db_type = "mongodb"
            print(f"[Database] Connected successfully to MongoDB: {db_name}")
            _setup_indexes(_db_instance)
            return _db_instance
        except Exception as e:
            print(f"[Database] MongoDB connection failed ({e}). Initializing resilient document store...")

    # Fallback to persistent local document storage (uses /tmp on Vercel/serverless)
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        data_dir = os.path.join("/tmp", ".data_store")
    else:
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


def ensure_baseline_system(db):
    """
    Guarantees baseline system users (admin, officer, citizen) and departments exist.
    Runs on every environment startup to prevent cold-start authentication failures.
    Preserves existing passwords or accounts if they already exist.
    """
    try:
        now = datetime.now(timezone.utc).isoformat()

        # 1. Baseline Users with verified bcrypt hashes for 'Password123!'
        baseline_users = [
            {
                "_id": "2da2e641-a103-4fc0-b21b-f8aa59359b14",
                "id": "2da2e641-a103-4fc0-b21b-f8aa59359b14",
                "email": "admin@raabta.gov.pk",
                "password_hash": "$2b$12$b3.sc337RAizWDyHBLqrGuCCBh3Sg2qwcbARzQILP3ddfOUVpAFK.",
                "full_name": "Dr. Sarah Farooq (Commissioner)",
                "phone": "+92 321 5554321",
                "role": "admin",
                "department_id": None,
                "is_active": True,
                "created_at": now,
                "updated_at": now
            },
            {
                "_id": "42ed13bd-f617-4e9e-ba8b-9408d3a07898",
                "id": "42ed13bd-f617-4e9e-ba8b-9408d3a07898",
                "email": "officer@raabta.gov.pk",
                "password_hash": "$2b$12$NmnWKbgVIGevbS2aYH9hY.uzLaCi6CnGM4mpT7bcwdqDvqm6ghXc.",
                "full_name": "Engr. Tariq Mehmood",
                "phone": "+92 333 5987654",
                "role": "officer",
                "department_id": "IESCO",
                "is_active": True,
                "created_at": now,
                "updated_at": now
            },
            {
                "_id": "825bdddc-949e-4a00-9d6e-d1736bf9613c",
                "id": "825bdddc-949e-4a00-9d6e-d1736bf9613c",
                "email": "citizen@raabta.gov.pk",
                "password_hash": "$2b$12$vDrW2qgAe5Sr3/gqVJhKCOE8BmxpXA.gV2BgIlykhGn1mVnwzp36O",
                "full_name": "Ahmad Bilal Khan",
                "phone": "+92 300 5123456",
                "role": "citizen",
                "department_id": None,
                "is_active": True,
                "created_at": now,
                "updated_at": now
            },
            {
                "_id": "cda-officer-seed-uuid-001",
                "id": "cda-officer-seed-uuid-001",
                "email": "officer.cda@raabta.gov.pk",
                "password_hash": "$2b$12$NmnWKbgVIGevbS2aYH9hY.uzLaCi6CnGM4mpT7bcwdqDvqm6ghXc.",
                "full_name": "Engr. Usman Qureshi",
                "phone": "+92 300 7654321",
                "role": "officer",
                "department_id": "CDA",
                "department_name": "Capital Development Authority (CDA)",
                "is_active": True,
                "created_at": now,
                "updated_at": now
            },
            {
                "_id": "wasa-officer-seed-uuid-002",
                "id": "wasa-officer-seed-uuid-002",
                "email": "officer.wasa@raabta.gov.pk",
                "password_hash": "$2b$12$NmnWKbgVIGevbS2aYH9hY.uzLaCi6CnGM4mpT7bcwdqDvqm6ghXc.",
                "full_name": "Asim Riaz",
                "phone": "+92 301 9876543",
                "role": "officer",
                "department_id": "WASA",
                "department_name": "Water and Sanitation Agency (WASA)",
                "is_active": True,
                "created_at": now,
                "updated_at": now
            },
            {
                "_id": "sngpl-officer-seed-uuid-003",
                "id": "sngpl-officer-seed-uuid-003",
                "email": "officer.sngpl@raabta.gov.pk",
                "password_hash": "$2b$12$NmnWKbgVIGevbS2aYH9hY.uzLaCi6CnGM4mpT7bcwdqDvqm6ghXc.",
                "full_name": "Hamza Abbasi",
                "phone": "+92 302 1122334",
                "role": "officer",
                "department_id": "SNGPL",
                "department_name": "Sui Northern Gas Pipelines Limited (SNGPL)",
                "is_active": True,
                "created_at": now,
                "updated_at": now
            },
            {
                "_id": "iwmc-officer-seed-uuid-004",
                "id": "iwmc-officer-seed-uuid-004",
                "email": "officer.iwmb@raabta.gov.pk",
                "password_hash": "$2b$12$NmnWKbgVIGevbS2aYH9hY.uzLaCi6CnGM4mpT7bcwdqDvqm6ghXc.",
                "full_name": "Malik Nadeem",
                "phone": "+92 303 5566778",
                "role": "officer",
                "department_id": "IWMB",
                "department_name": "Waste Management & Cleanliness (IWMC)",
                "is_active": True,
                "created_at": now,
                "updated_at": now
            }
        ]

        for u in baseline_users:
            existing = db.users.find_one({"email": u["email"]})
            if not existing:
                db.users.insert_one(u)
                print(f"[Bootstrap] Seeded baseline user: {u['email']} ({u['role']})")

        # 2. Baseline Departments
        baseline_departments = [
            {
                "_id": "IESCO",
                "code": "IESCO",
                "name": "Islamabad Electric Supply Company",
                "jurisdiction": "Islamabad Capital Territory & Rawalpindi",
                "sla_hours": 4,
                "active_officers": 8,
                "current_load": 14,
                "emergency_hotline": "118",
                "created_at": now
            },
            {
                "_id": "CDA_WATER",
                "code": "CDA_WATER",
                "name": "CDA Water Supply Wing",
                "jurisdiction": "Islamabad Sectors G, F, I, H",
                "sla_hours": 8,
                "active_officers": 6,
                "current_load": 9,
                "emergency_hotline": "051-9252028",
                "created_at": now
            },
            {
                "_id": "MCI_SAN",
                "code": "MCI_SAN",
                "name": "MCI Sanitation Directorate",
                "jurisdiction": "Islamabad Urban & Rural Zones",
                "sla_hours": 12,
                "active_officers": 12,
                "current_load": 22,
                "emergency_hotline": "051-9204000",
                "created_at": now
            },
            {
                "_id": "RESCUE_1122",
                "code": "RESCUE_1122",
                "name": "Rescue 1122 Emergency Services",
                "jurisdiction": "ICT Emergency Response",
                "sla_hours": 1,
                "active_officers": 25,
                "current_load": 5,
                "emergency_hotline": "1122",
                "created_at": now
            },
            {
                "_id": "ITP",
                "code": "ITP",
                "name": "Islamabad Traffic Police",
                "jurisdiction": "Expressway, Kashmir Hwy, Murree Rd",
                "sla_hours": 2,
                "active_officers": 15,
                "current_load": 8,
                "emergency_hotline": "1915",
                "created_at": now
            }
        ]

        for d in baseline_departments:
            existing = db.departments.find_one({"code": d["code"]})
            if not existing:
                db.departments.insert_one(d)
                print(f"[Bootstrap] Seeded baseline department: {d['code']}")
    except Exception as e:
        print(f"[Bootstrap] Warning during baseline data verification: {e}")


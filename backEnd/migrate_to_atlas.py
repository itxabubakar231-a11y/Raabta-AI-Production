"""
Raabta AI - Migration Script: Local Data Store -> MongoDB Atlas
Migrates local documents from backEnd/.data_store into MongoDB Atlas.
Safe and idempotent: uses upsert based on document _id to prevent duplicate records.
"""

import os
import sys
import json
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

load_dotenv(os.path.join(current_dir, ".env"))

try:
    from pymongo import MongoClient
    import dns
except ImportError:
    print("[ERROR] Required packages 'pymongo' or 'dnspython' are not installed.")
    sys.exit(1)


def run_migration():
    uri = os.environ.get("MONGODB_URI") or os.getenv("MONGODB_URI")
    db_name = os.environ.get("MONGODB_DB_NAME") or os.getenv("MONGODB_DB_NAME") or "raabta_ai"

    if not uri:
        print("[ERROR] MONGODB_URI is not set in backEnd/.env.")
        print("Please add MONGODB_URI to backEnd/.env with your real password.")
        sys.exit(1)

    if "<db_password>" in uri or "<password>" in uri:
        print("[ERROR] MONGODB_URI contains the placeholder '<db_password>'.")
        print("Please replace '<db_password>' with your real MongoDB Atlas user password in backEnd/.env.")
        sys.exit(1)

    print("=" * 60)
    print("RAABTA AI -> MONGODB ATLAS MIGRATION")
    print("=" * 60)
    print(f"Target Database: {db_name}")

    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=10000)
        client.admin.command("ping")
        print("[OK] Successfully connected to MongoDB Atlas!")
    except Exception as e:
        print(f"[ERROR] Connection to MongoDB Atlas failed: {e}")
        print("\nTroubleshooting tips:")
        print("1. Did you replace '<db_password>' with your actual database user password?")
        print("2. In MongoDB Atlas -> Network Access, did you allow 0.0.0.0/0 (Access from anywhere)?")
        print("3. Check that your database username exists under Database Access.")
        sys.exit(1)

    db = client[db_name]
    data_store_dir = os.path.join(current_dir, ".data_store")

    if not os.path.exists(data_store_dir):
        print(f"[INFO] No local data store found at {data_store_dir}.")
        return

    collections_to_migrate = [
        ("users", "users.json"),
        ("departments", "departments.json"),
        ("civic_reports", "civic_reports.json"),
        ("issue_clusters", "issue_clusters.json"),
        ("notifications", "notifications.json"),
        ("audit_logs", "audit_logs.json"),
        ("internal_notes", "internal_notes.json")
    ]

    print("\nStarting collection sync...")
    total_synced = 0

    for col_name, filename in collections_to_migrate:
        filepath = os.path.join(data_store_dir, filename)
        if not os.path.exists(filepath):
            continue

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)

            if isinstance(data, dict):
                docs = list(data.values())
            elif isinstance(data, list):
                docs = data
            else:
                docs = []

            count = 0
            for doc in docs:
                doc_id = doc.get("_id") or doc.get("id")
                if not doc_id:
                    continue
                db[col_name].replace_one({"_id": doc_id}, doc, upsert=True)
                count += 1

            print(f" -> {col_name}: migrated/synced {count} documents from {filename}")
            total_synced += count
        except Exception as err:
            print(f" [WARN] Failed migrating {filename}: {err}")

    print("=" * 60)
    print(f"MIGRATION COMPLETE: {total_synced} total documents successfully synchronized to Atlas!")
    print("=" * 60)


if __name__ == "__main__":
    run_migration()

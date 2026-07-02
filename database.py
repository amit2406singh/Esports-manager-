import json
import os
from typing import List, Dict, Any, Optional
import uuid
from pymongo import MongoClient

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = "esports_manager"

class HybridDatabase:
    def __init__(self):
        self.use_mongo = False
        self.client = None
        self.db = None
        self.local_file = os.path.join(os.path.dirname(__file__), "db_local.json")
        
        # Initialize local file DB if not present
        if not os.path.exists(self.local_file):
            self._write_local({
                "users": [
                    {
                        "id": "u1", "username": "ApexPredator", "password": "password123", "game": "Valorant", "role": "player", 
                        "skills": {"MMR": 1850, "win_rate": 0.62, "precision": 82, "positioning": 78, "teamwork": 85, "sportsmanship": 90, "cheat_risk": 5},
                        "achievements": ["badge_first_win", "badge_sportsman"], "team_id": "t1"
                    },
                    {
                        "id": "u2", "username": "ShadowSniper", "password": "password123", "game": "Valorant", "role": "player", 
                        "skills": {"MMR": 1720, "win_rate": 0.58, "precision": 91, "positioning": 65, "teamwork": 72, "sportsmanship": 80, "cheat_risk": 15},
                        "achievements": ["badge_sharpshooter"], "team_id": "t1"
                    },
                    {
                        "id": "u3", "username": "Vortex", "password": "password123", "game": "League of Legends", "role": "player", 
                        "skills": {"MMR": 1910, "win_rate": 0.65, "precision": 88, "positioning": 84, "teamwork": 90, "sportsmanship": 95, "cheat_risk": 2},
                        "achievements": ["badge_mvp"], "team_id": "t2"
                    },
                    {
                        "id": "u4", "username": "Cipher", "password": "password123", "game": "Counter Strike 2", "role": "player", 
                        "skills": {"MMR": 1600, "win_rate": 0.51, "precision": 70, "positioning": 72, "teamwork": 82, "sportsmanship": 88, "cheat_risk": 8},
                        "achievements": [], "team_id": "t2"
                    },
                    {
                        "id": "u5", "username": "TacticalSage", "password": "password123", "game": "Valorant", "role": "coach", 
                        "skills": {"MMR": 2100, "win_rate": 0.70, "precision": 80, "positioning": 95, "teamwork": 98, "sportsmanship": 100, "cheat_risk": 0},
                        "achievements": ["badge_guru"], "team_id": None
                    }
                ],
                "teams": [
                    {"id": "t1", "name": "Team Nova", "password": "password123", "captain_id": "u1", "members": ["u1", "u2"], "logo": "⚡", "stats": {"wins": 12, "losses": 5}},
                    {"id": "t2", "name": "Aether Esports", "password": "password123", "captain_id": "u3", "members": ["u3", "u4"], "logo": "🌌", "stats": {"wins": 15, "losses": 4}}
                ],
                "tournaments": [],
                "matches": [],
                "chats": [],
                "analytics": [],
                "prizes": []
            })
            
        try:
            self.client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
            self.client.server_info()  # Check if connection is alive
            self.db = self.client[DB_NAME]
            self.use_mongo = True
            print("Successfully connected to MongoDB.")
        except Exception as e:
            print(f"MongoDB connection failed: {e}. Defaulting to JSON storage: {self.local_file}")
            self.use_mongo = False

    def _read_local(self) -> Dict[str, Any]:
        try:
            with open(self.local_file, "r") as f:
                return json.load(f)
        except Exception:
            return {"users": [], "teams": [], "tournaments": [], "matches": [], "chats": [], "analytics": [], "prizes": []}

    def _write_local(self, data: Dict[str, Any]):
        try:
            with open(self.local_file, "w") as f:
                json.dump(data, f, indent=4, default=str)
        except Exception as e:
            print(f"Failed to write to local database: {e}")

    def find(self, collection: str, query: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        if self.use_mongo:
            mongo_query = query or {}
            res = list(self.db[collection].find(mongo_query))
            for item in res:
                if "_id" in item:
                    item["id"] = str(item["_id"])
                    del item["_id"]
            return res
        else:
            db_data = self._read_local()
            items = db_data.get(collection, [])
            if not query:
                return items
            
            filtered = []
            for item in items:
                matches = True
                for k, v in query.items():
                    if item.get(k) != v:
                        matches = False
                        break
                if matches:
                    filtered.append(item)
            return filtered

    def find_one(self, collection: str, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        results = self.find(collection, query)
        return results[0] if results else None

    def insert_one(self, collection: str, document: Dict[str, Any]) -> Dict[str, Any]:
        if "id" not in document:
            document["id"] = str(uuid.uuid4())
            
        if self.use_mongo:
            doc_copy = document.copy()
            # If id is specified, mongo uses _id or custom ID fields, we'll keep both clean
            doc_copy["_id"] = doc_copy["id"]
            self.db[collection].insert_one(doc_copy)
            return document
        else:
            db_data = self._read_local()
            if collection not in db_data:
                db_data[collection] = []
            db_data[collection].append(document)
            self._write_local(db_data)
            return document

    def update_one(self, collection: str, query: Dict[str, Any], update_data: Dict[str, Any]) -> bool:
        if self.use_mongo:
            # We assume update_data is direct field updates rather than $set
            # Let's map it to $set
            result = self.db[collection].update_one(query, {"$set": update_data})
            return result.modified_count > 0
        else:
            db_data = self._read_local()
            items = db_data.get(collection, [])
            updated = False
            for idx, item in enumerate(items):
                matches = True
                for k, v in query.items():
                    if item.get(k) != v:
                        matches = False
                        break
                if matches:
                    items[idx].update(update_data)
                    updated = True
                    break
            if updated:
                db_data[collection] = items
                self._write_local(db_data)
            return updated

    def delete_one(self, collection: str, query: Dict[str, Any]) -> bool:
        if self.use_mongo:
            result = self.db[collection].delete_one(query)
            return result.deleted_count > 0
        else:
            db_data = self._read_local()
            items = db_data.get(collection, [])
            target_idx = -1
            for idx, item in enumerate(items):
                matches = True
                for k, v in query.items():
                    if item.get(k) != v:
                        matches = False
                        break
                if matches:
                    target_idx = idx
                    break
            if target_idx != -1:
                items.pop(target_idx)
                db_data[collection] = items
                self._write_local(db_data)
                return True
            return False

db = HybridDatabase()

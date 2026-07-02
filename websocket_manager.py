from fastapi import WebSocket
from typing import Dict, List, Set
import json

class ConnectionManager:
    def __init__(self):
        # Room-based connection mapping: room_id -> list of websockets
        self.active_rooms: Dict[str, Set[WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = set()
        self.active_rooms[room_id].add(websocket)
        print(f"WebSocket client connected to room: {room_id}. Total active in room: {len(self.active_rooms[room_id])}")

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_rooms:
            if websocket in self.active_rooms[room_id]:
                self.active_rooms[room_id].remove(websocket)
                print(f"WebSocket client disconnected from room: {room_id}. Remaining: {len(self.active_rooms[room_id])}")
            if not self.active_rooms[room_id]:
                del self.active_rooms[room_id]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_text(json.dumps(message))

    async def broadcast_to_room(self, room_id: str, message: dict):
        if room_id in self.active_rooms:
            disconnected_sockets = set()
            for connection in self.active_rooms[room_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    print(f"Failed to broadcast to a socket in room {room_id}: {e}")
                    disconnected_sockets.add(connection)
            
            # Clean up dead sockets
            for socket in disconnected_sockets:
                self.disconnect(socket, room_id)

manager = ConnectionManager()

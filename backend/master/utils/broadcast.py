"""Broadcast abstraction layer.

Wraps the in-memory `update_manager` and exposes the same interface.
This allows swapping the implementation (e.g., Redis Pub/Sub) later without
changing controller/service code.
"""
from typing import Dict, List
from ..schemas.update_schema import UpdateEvent
from .update_manager import update_manager as _update_manager


class BroadcastManager:
    async def connect(self, websocket, user_id: int, username: str):
        return await _update_manager.connect(websocket, user_id, username)

    def disconnect(self, user_id: int):
        return _update_manager.disconnect(user_id)

    async def broadcast(self, event: UpdateEvent):
        return await _update_manager.broadcast(event)

    async def send_to_user(self, user_id: int, event: UpdateEvent):
        return await _update_manager.send_to_user(user_id, event)

    def get_active_users_count(self) -> int:
        return _update_manager.get_active_users_count()

    def get_active_users(self) -> list[dict]:
        return _update_manager.get_active_users()


# Single instance used by controllers
broadcast_manager = BroadcastManager()

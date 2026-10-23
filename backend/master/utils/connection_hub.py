import json
import logging
from collections import defaultdict

from fastapi import WebSocket
from pydantic import BaseModel

logger = logging.getLogger(__name__)


def _serialize(payload: BaseModel | dict) -> str:
    if isinstance(payload, BaseModel):
        return payload.model_dump_json()
    return json.dumps(payload, default=str)


class ConnectionHub:
    """Conexões WebSocket agrupadas por usuário (um usuário pode ter várias abas)."""

    def __init__(self):
        self._connections: dict[int, set[WebSocket]] = defaultdict(set)
        self._names: dict[int, str] = {}

    async def connect(self, websocket: WebSocket, user_id: int, username: str, subprotocol: str | None = None) -> None:
        await websocket.accept(subprotocol=subprotocol)
        self._connections[user_id].add(websocket)
        self._names[user_id] = username

    def disconnect(self, websocket: WebSocket, user_id: int) -> None:
        sockets = self._connections.get(user_id)
        if sockets is None:
            return
        sockets.discard(websocket)
        if not sockets:
            self._connections.pop(user_id, None)
            self._names.pop(user_id, None)

    def is_connected(self, user_id: int) -> bool:
        return bool(self._connections.get(user_id))

    async def _send(self, user_id: int, websocket: WebSocket, text: str) -> None:
        try:
            await websocket.send_text(text)
        except Exception:
            logger.warning("Dropping broken websocket for user %s", user_id)
            self.disconnect(websocket, user_id)

    async def send_to_user(self, user_id: int, payload: BaseModel | dict) -> None:
        text = _serialize(payload)
        for websocket in list(self._connections.get(user_id, ())):
            await self._send(user_id, websocket, text)

    async def broadcast(self, payload: BaseModel | dict) -> None:
        text = _serialize(payload)
        for user_id, sockets in list(self._connections.items()):
            for websocket in list(sockets):
                await self._send(user_id, websocket, text)

    def get_active_users(self) -> list[dict]:
        return [{"user_id": uid, "username": self._names.get(uid, "Unknown")} for uid in self._connections]

    def get_active_users_count(self) -> int:
        return len(self._connections)

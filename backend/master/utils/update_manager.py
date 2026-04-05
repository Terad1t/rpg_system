from fastapi import WebSocket
from typing import Dict, List
import json
from schemas.update_schema import UpdateEvent

class UpdateConnectionManager:
    """Gerencia conexões WebSocket para atualizações em tempo real"""

    def __init__(self):
        # Mapeia user_id -> WebSocket connection
        self.active_connections: Dict[int, WebSocket] = {}
        # Mapeia user_id -> username para referência
        self.user_names: Dict[int, str] = {}

    async def connect(self, websocket: WebSocket, user_id: int, username: str):
        """Conecta um novo usuário para receber atualizações"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_names[user_id] = username

    def disconnect(self, user_id: int):
        """Desconecta um usuário"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            del self.user_names[user_id]

    async def broadcast(self, event: UpdateEvent):
        """Envia um evento para todos os usuários conectados"""
        if not self.active_connections:
            return

        event_json = event.model_dump_json()

        # Lista de conexões a remover (se estiverem desconectadas)
        disconnected_users = []

        for user_id, connection in self.active_connections.items():
            try:
                await connection.send_text(event_json)
            except Exception as e:
                # Conexão quebrada, marca para remoção
                disconnected_users.append(user_id)

        # Remove conexões quebradas
        for user_id in disconnected_users:
            self.disconnect(user_id)

    async def send_to_user(self, user_id: int, event: UpdateEvent):
        """Envia um evento para um usuário específico"""
        if user_id in self.active_connections:
            connection = self.active_connections[user_id]
            try:
                await connection.send_text(event.model_dump_json())
            except Exception:
                self.disconnect(user_id)

    def get_active_users_count(self) -> int:
        """Retorna número de usuários conectados para atualizações"""
        return len(self.active_connections)

    def get_active_users(self) -> list[dict]:
        """Retorna lista de usuários conectados para atualizações"""
        return [
            {"user_id": uid, "username": self.user_names.get(uid, "Unknown")}
            for uid in self.active_connections.keys()
        ]

# Instância global do gerenciador de atualizações
update_manager = UpdateConnectionManager()
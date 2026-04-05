from fastapi import WebSocket
from typing import Dict, List
import json
from schemas.chat_schema import ChatMessageBroadcast
from datetime import datetime

class ConnectionManager:
    """Gerencia conexões WebSocket e broadcast de mensagens"""
    
    def __init__(self):
        # Mapeia user_id -> WebSocket connection
        self.active_connections: Dict[int, WebSocket] = {}
        # Mapeia user_id -> username para referência
        self.user_names: Dict[int, str] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int, username: str):
        """Conecta um novo usuário"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.user_names[user_id] = username
        
        # Notifica todos os usuários que alguém entrou
        await self.broadcast_system_message(f"{username} joined the chat")
    
    def disconnect(self, user_id: int):
        """Desconecta um usuário"""
        if user_id in self.active_connections:
            username = self.user_names.get(user_id, "Unknown")
            del self.active_connections[user_id]
            del self.user_names[user_id]
    
    async def broadcast(self, message: ChatMessageBroadcast):
        """Envia uma mensagem para todos os usuários conectados"""
        if not self.active_connections:
            return
        
        message_json = message.model_dump_json()
        
        # Lista de conexões a remover (se estiverem desconectadas)
        disconnected_users = []
        
        for user_id, connection in self.active_connections.items():
            try:
                await connection.send_text(message_json)
            except Exception as e:
                # Conexão quebrada, marca para remoção
                disconnected_users.append(user_id)
        
        # Remove conexões quebradas
        for user_id in disconnected_users:
            self.disconnect(user_id)
    
    async def send_to_user(self, user_id: int, message: ChatMessageBroadcast):
        """Envia uma mensagem para um usuário específico"""
        if user_id in self.active_connections:
            connection = self.active_connections[user_id]
            try:
                await connection.send_text(message.model_dump_json())
            except Exception:
                self.disconnect(user_id)
    
    async def broadcast_system_message(self, content: str):
        """Envia uma mensagem do sistema (sem user_id)"""
        message = ChatMessageBroadcast(
            user_id=0,
            username="System",
            message=content,
            created_at=datetime.utcnow().isoformat(),
            message_type="system"
        )
        await self.broadcast(message)
    
    def get_active_users_count(self) -> int:
        """Retorna número de usuários conectados"""
        return len(self.active_connections)
    
    def get_active_users(self) -> list[dict]:
        """Retorna list de usuários conectados"""
        return [
            {"user_id": uid, "username": self.user_names.get(uid, "Unknown")}
            for uid in self.active_connections.keys()
        ]

# Instância global do gerenciador
chat_manager = ConnectionManager()
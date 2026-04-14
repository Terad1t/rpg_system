from fastapi import WebSocket
from typing import Dict, List, Optional
import json
from datetime import datetime

class InventoryManager:
    """Gerencia eventos de inventário em tempo real via WebSocket"""
    
    def __init__(self):
        # Mapeia character_id -> lista de WebSocket connections
        self.inventory_subscriptions: Dict[int, List[WebSocket]] = {}
        # Mapeia user_id -> lista de WebSocket connections (para notificações gerais)
        self.user_subscriptions: Dict[int, List[WebSocket]] = {}
    
    async def subscribe_to_character_inventory(self, websocket: WebSocket, character_id: int):
        """Inscreve um websocket para receber atualizações do inventário de um personagem"""
        await websocket.accept()
        if character_id not in self.inventory_subscriptions:
            self.inventory_subscriptions[character_id] = []
        self.inventory_subscriptions[character_id].append(websocket)
    
    async def subscribe_to_user_updates(self, websocket: WebSocket, user_id: int):
        """Inscreve um websocket para receber notificações gerais para um usuário"""
        await websocket.accept()
        if user_id not in self.user_subscriptions:
            self.user_subscriptions[user_id] = []
        self.user_subscriptions[user_id].append(websocket)
    
    async def broadcast_inventory_update(
        self, 
        character_id: int, 
        action: str, 
        item_id: int, 
        item_name: str, 
        quantity: int,
        performed_by: int
    ):
        """
        Emite notificação de atualização de inventário
        action: "added", "removed", "updated"
        """
        if character_id not in self.inventory_subscriptions:
            return
        
        message = {
            "type": "inventory_update",
            "character_id": character_id,
            "action": action,
            "item_id": item_id,
            "item_name": item_name,
            "quantity": quantity,
            "performed_by": performed_by,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        message_json = json.dumps(message)
        disconnected_sockets = []
        
        for websocket in self.inventory_subscriptions[character_id]:
            try:
                await websocket.send_text(message_json)
            except Exception:
                disconnected_sockets.append(websocket)
        
        # Remove conexões quebradas
        for ws in disconnected_sockets:
            if ws in self.inventory_subscriptions[character_id]:
                self.inventory_subscriptions[character_id].remove(ws)
    
    async def broadcast_to_user(
        self, 
        user_id: int, 
        notification_type: str,
        data: dict
    ):
        """Emite notificações gerais para um usuário"""
        if user_id not in self.user_subscriptions:
            return
        
        message = {
            "type": notification_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        message_json = json.dumps(message)
        disconnected_sockets = []
        
        for websocket in self.user_subscriptions[user_id]:
            try:
                await websocket.send_text(message_json)
            except Exception:
                disconnected_sockets.append(websocket)
        
        # Remove conexões quebradas
        for ws in disconnected_sockets:
            if ws in self.user_subscriptions[user_id]:
                self.user_subscriptions[user_id].remove(ws)
    
    def unsubscribe_from_character_inventory(self, websocket: WebSocket, character_id: int):
        """Remove inscrição de um websocket"""
        if character_id in self.inventory_subscriptions:
            try:
                self.inventory_subscriptions[character_id].remove(websocket)
            except ValueError:
                pass
    
    def unsubscribe_from_user_updates(self, websocket: WebSocket, user_id: int):
        """Remove inscrição de um websocket"""
        if user_id in self.user_subscriptions:
            try:
                self.user_subscriptions[user_id].remove(websocket)
            except ValueError:
                pass
    
    def get_inventory_subscribers_count(self, character_id: int) -> int:
        """Retorna número de inscritos para um inventário específico"""
        return len(self.inventory_subscriptions.get(character_id, []))
    
    def get_user_subscribers_count(self, user_id: int) -> int:
        """Retorna número de inscritos para um usuário"""
        return len(self.user_subscriptions.get(user_id, []))


# Instância global do gerenciador
inventory_manager = InventoryManager()

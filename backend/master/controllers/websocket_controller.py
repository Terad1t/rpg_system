from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from ..utils.inventory_manager import inventory_manager

router = APIRouter(prefix="/ws", tags=["websocket"])

@router.websocket("/inventory/{character_id}")
async def websocket_inventory_endpoint(
    websocket: WebSocket, 
    character_id: int,
    token: str = None
):
    """
    WebSocket para receber atualizações de inventário em tempo real
    Uso: ws://localhost:8000/ws/inventory/{character_id}?token={auth_token}
    """
    await inventory_manager.subscribe_to_character_inventory(websocket, character_id)
    
    try:
        while True:
            # Mantém a conexão aberta e aguarda mensagens
            data = await websocket.receive_text()
            # Pode processar ping/keep-alive aqui se necessário
    except WebSocketDisconnect:
        inventory_manager.unsubscribe_from_character_inventory(websocket, character_id)

@router.websocket("/user-updates/{user_id}")
async def websocket_user_updates_endpoint(
    websocket: WebSocket,
    user_id: int,
    token: str = None
):
    """
    WebSocket para receber notificações gerais de um usuário em tempo real
    Uso: ws://localhost:8000/ws/user-updates/{user_id}?token={auth_token}
    """
    await inventory_manager.subscribe_to_user_updates(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        inventory_manager.unsubscribe_from_user_updates(websocket, user_id)

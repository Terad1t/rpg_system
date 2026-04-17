from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..models.character_model import Character
from ..services.auth_services import get_user_by_id
from ..utils.auth_utils import decode_token
from ..utils.inventory_manager import inventory_manager

router = APIRouter(prefix="/ws", tags=["websocket"])


@router.websocket("/inventory/{character_id}")
async def websocket_inventory_endpoint(
    websocket: WebSocket,
    character_id: int,
    token: str | None = None,
    db: Session = Depends(get_db),
):
    """
    WebSocket para receber atualizações de inventário em tempo real
    Uso: ws://localhost:8000/ws/inventory/{character_id}?token={auth_token}
    """
    payload = decode_token(token) if token else None
    if not payload:
        await websocket.close(code=1008)
        return

    current_user_id = int(payload["user_id"])
    current_role = payload.get("role")

    user = get_user_by_id(db, current_user_id)
    if not user or not user.is_active:
        await websocket.close(code=1008)
        return

    # Players só podem assinar inventário dos próprios personagens. Masters podem assinar qualquer um.
    if current_role != "master":
        character = db.query(Character).filter(Character.id == character_id).first()
        if not character or int(character.user_id or 0) != current_user_id:
            await websocket.close(code=1008)
            return

    await inventory_manager.subscribe_to_character_inventory(websocket, character_id)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        inventory_manager.unsubscribe_from_character_inventory(websocket, character_id)


@router.websocket("/user-updates/{user_id}")
async def websocket_user_updates_endpoint(
    websocket: WebSocket,
    user_id: int,
    token: str | None = None,
    db: Session = Depends(get_db),
):
    """
    WebSocket para receber notificações gerais de um usuário em tempo real
    Uso: ws://localhost:8000/ws/user-updates/{user_id}?token={auth_token}
    """
    payload = decode_token(token) if token else None
    if not payload:
        await websocket.close(code=1008)
        return

    current_user_id = int(payload["user_id"])

    user = get_user_by_id(db, current_user_id)
    if not user or not user.is_active:
        await websocket.close(code=1008)
        return

    # Um usuário só pode assinar o próprio canal de notificações.
    if current_user_id != int(user_id):
        await websocket.close(code=1008)
        return

    await inventory_manager.subscribe_to_user_updates(websocket, user_id)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        inventory_manager.unsubscribe_from_user_updates(websocket, user_id)

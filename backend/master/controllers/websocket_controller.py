import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from ..models.character_model import Character
from ..utils.auth_dependencies import CurrentUser, authenticate_websocket, websocket_subprotocol
from ..utils.inventory_manager import inventory_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websocket"])


def _can_watch_character(db: Session, user: CurrentUser, character_id: int) -> bool:
    """Master vê qualquer personagem; jogador só os próprios."""
    if user.is_master:
        return True
    character = db.get(Character, character_id)
    return bool(character and character.user_id == user.user_id)


async def _keep_alive(websocket: WebSocket) -> None:
    """Mantém a conexão aberta até o cliente desconectar (mensagens recebidas são ignoradas)."""
    while True:
        await websocket.receive_text()


@router.websocket("/inventory/{character_id}")
async def websocket_inventory_endpoint(websocket: WebSocket, character_id: int):
    """Atualizações de inventário: ws://host/ws/inventory/{character_id}?token=..."""
    user = await authenticate_websocket(websocket, lambda db, u: _can_watch_character(db, u, character_id))
    if user is None:
        return

    await inventory_manager.subscribe_to_character_inventory(
        websocket, character_id, subprotocol=websocket_subprotocol(websocket)
    )
    try:
        await _keep_alive(websocket)
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("Unhandled inventory websocket error for character %s", character_id)
    finally:
        inventory_manager.unsubscribe_from_character_inventory(websocket, character_id)


@router.websocket("/user-updates/{user_id}")
async def websocket_user_updates_endpoint(websocket: WebSocket, user_id: int):
    """Notificações do próprio usuário: ws://host/ws/user-updates/{user_id}?token=..."""
    user = await authenticate_websocket(websocket, lambda _db, u: u.user_id == user_id)
    if user is None:
        return

    await inventory_manager.subscribe_to_user_updates(websocket, user_id, subprotocol=websocket_subprotocol(websocket))
    try:
        await _keep_alive(websocket)
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("Unhandled user updates websocket error for user %s", user_id)
    finally:
        inventory_manager.unsubscribe_from_user_updates(websocket, user_id)


@router.websocket("/character-view/{character_id}")
async def websocket_character_view_endpoint(websocket: WebSocket, character_id: int):
    """Ficha ao vivo (HP, mana, buffs): ws://host/ws/character-view/{character_id}?token=..."""
    user = await authenticate_websocket(websocket, lambda db, u: _can_watch_character(db, u, character_id))
    if user is None:
        return

    await inventory_manager.subscribe_to_character_view(websocket, character_id, subprotocol=websocket_subprotocol(websocket))
    try:
        await _keep_alive(websocket)
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("Unhandled character view websocket error for character %s", character_id)
    finally:
        inventory_manager.unsubscribe_from_character_view(websocket, character_id)

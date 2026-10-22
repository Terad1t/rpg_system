import logging

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from ..utils.auth_dependencies import CurrentUser, authenticate_websocket, get_current_master, websocket_subprotocol
from ..utils.broadcast import broadcast_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/updates", tags=["updates"])


@router.websocket("/ws")
async def websocket_updates_endpoint(websocket: WebSocket):
    """Atualizações do mundo (personagens, habilidades, mapas) para jogadores: /api/updates/ws?token=..."""
    user = await authenticate_websocket(websocket, lambda _db, u: u.role == "player")
    if user is None:
        return

    await broadcast_manager.connect(websocket, user.user_id, user.login, subprotocol=websocket_subprotocol(websocket))
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("Unhandled updates websocket error for user %s", user.user_id)
    finally:
        broadcast_manager.disconnect(websocket, user.user_id)


@router.get("/active-users")
def get_active_update_users(_master: CurrentUser = Depends(get_current_master)):
    return {
        "active_users": broadcast_manager.get_active_users(),
        "total": broadcast_manager.get_active_users_count(),
    }

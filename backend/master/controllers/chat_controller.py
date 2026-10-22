import json
import logging

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from pydantic import ValidationError
from sqlalchemy.orm import Session

from ...player.services.player_character_services import get_player_character
from ..core.time import utcnow
from ..database.connection import SessionLocal, get_db
from ..schemas.chat_schema import ChatHistoryResponse, ChatMessageBroadcast, ChatMessageCreate, ChatMessageRead
from ..services.chat_services import create_chat_message, get_chat_history, get_recent_messages
from ..utils.auth_dependencies import CurrentUser, authenticate_websocket, get_current_player, websocket_subprotocol
from ..utils.chat_manager import chat_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])

HISTORY_ON_CONNECT = 20


def _system_message(text: str, message_type: str = "system") -> ChatMessageBroadcast:
    return ChatMessageBroadcast(
        user_id=0,
        username="System",
        message=text,
        created_at=utcnow().isoformat(),
        message_type=message_type,
    )


# ========== REST ==========


@router.get("/history", response_model=ChatHistoryResponse)
def get_chat_history_endpoint(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _player: CurrentUser = Depends(get_current_player),
    db: Session = Depends(get_db),
):
    messages, total = get_chat_history(db, limit=limit, offset=offset)
    return ChatHistoryResponse(messages=[ChatMessageRead.model_validate(msg) for msg in messages], total=total)


@router.get("/active-users")
def get_active_users(_player: CurrentUser = Depends(get_current_player)):
    return {"active_users": chat_manager.get_active_users(), "total": chat_manager.get_active_users_count()}


# ========== WEBSOCKET ==========


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, character_id: int | None = Query(None, ge=1)):
    """Chat em tempo real dos jogadores: /api/chat/ws?token=...&character_id=...

    Com `character_id`, a mensagem aparece com o codinome do personagem
    (que precisa pertencer ao jogador). O Master não entra no chat.
    """
    display_name: dict[str, str] = {}

    def authorize(db: Session, user: CurrentUser) -> bool:
        if user.role != "player":
            return False
        display_name["value"] = user.login
        if character_id is not None:
            character = get_player_character(db, character_id=character_id, user_id=user.user_id)
            if character is None:
                return False
            display_name["value"] = character.codename or character.name or user.login
        return True

    user = await authenticate_websocket(websocket, authorize)
    if user is None:
        return
    username = display_name["value"]

    await chat_manager.connect(websocket, user.user_id, username, subprotocol=websocket_subprotocol(websocket))
    await chat_manager.broadcast(_system_message(f"{username} joined the chat", "user_joined"))

    with SessionLocal() as db:
        recent = get_recent_messages(db, limit=HISTORY_ON_CONNECT)
    for msg in recent:
        await websocket.send_text(
            ChatMessageBroadcast(
                id=msg.id,
                user_id=msg.user_id,
                username=msg.username,
                message=msg.message,
                created_at=msg.created_at.isoformat() if msg.created_at else None,
                message_type="history",
            ).model_dump_json()
        )

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                incoming = ChatMessageCreate(message=str(json.loads(raw).get("message", "")).strip())
            except (json.JSONDecodeError, AttributeError, ValidationError):
                await websocket.send_text(
                    _system_message("Message must be JSON with 1-1000 characters", "error").model_dump_json()
                )
                continue

            # O texto é guardado como veio; o frontend (React) escapa ao exibir.
            with SessionLocal() as db:
                saved = create_chat_message(db, user.user_id, username, incoming)
                broadcast = ChatMessageBroadcast(
                    id=saved.id,
                    user_id=user.user_id,
                    username=username,
                    message=saved.message,
                    created_at=saved.created_at.isoformat() if saved.created_at else utcnow().isoformat(),
                    message_type="message",
                )
            await chat_manager.broadcast(broadcast)
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("Unhandled chat websocket error for user %s", user.user_id)
    finally:
        chat_manager.disconnect(websocket, user.user_id)
        await chat_manager.broadcast(_system_message(f"{username} left the chat", "user_left"))

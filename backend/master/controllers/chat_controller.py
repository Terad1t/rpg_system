from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status, Query, Depends
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..utils.auth_utils import decode_token
from ..utils.chat_manager import chat_manager
from ..utils.auth_dependencies import get_current_player, CurrentUser
from ..schemas.chat_schema import ChatMessageBroadcast, ChatHistoryResponse, ChatMessageRead
from ..services.chat_services import create_chat_message, get_chat_history, get_recent_messages
from ..services.auth_services import get_user_by_id
import json
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["chat"])

# ========== REST ENDPOINTS ==========

@router.get("/history", response_model=ChatHistoryResponse)
def get_chat_history_endpoint(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_player: CurrentUser = Depends(get_current_player),
    db: Session = Depends(get_db)
):
    """
    Obtém o histórico de mensagens do chat.
    Apenas players autenticados podem acessar o histórico.
    """
    messages, total = get_chat_history(db, limit=limit, offset=offset)
    
    message_reads = [
        ChatMessageRead(
            id=msg.id,
            user_id=msg.user_id,
            username=msg.username,
            message=msg.message,
            created_at=msg.created_at
        )
        for msg in messages
    ]
    
    return ChatHistoryResponse(messages=message_reads, total=total)

@router.get("/active-users")
def get_active_users():
    """Retorna lista de usuários conectados ao chat em tempo real"""
    return {
        "active_users": chat_manager.get_active_users(),
        "total": chat_manager.get_active_users_count()
    }

# ========== WEBSOCKET ==========

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebSocket para chat em tempo real.
    
    Query params:
    - token: JWT token de autenticação
    
    Apenas players podem conectar.
    Master é bloqueado automaticamente.
    """
    
    # ========== VALIDAÇÃO DE AUTENTICAÇÃO ==========
    
    payload = decode_token(token)
    
    if payload is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid or expired token")
        return
    
    user_id = payload.get("user_id")
    role = payload.get("role")
    
    # ========== VALIDAÇÃO DE ROLE ==========
    
    if role != "player":
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Only players can access chat")
        return
    
    # ========== VALIDAÇÃO DE USUÁRIO ==========
    
    user = get_user_by_id(db, user_id)
    
    if not user or not user.is_active:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User not found or inactive")
        return
    
    # ========== CONEXÃO ==========
    
    username = user.login  # Usa o login como username
    
    await chat_manager.connect(websocket, user_id, username)
    
    # Envia histórico recente para o novo usuário
    try:
        recent_messages = get_recent_messages(db, limit=20)
        for msg in recent_messages:
            history_msg = ChatMessageBroadcast(
                id=msg.id,
                user_id=msg.user_id,
                username=msg.username,
                message=msg.message,
                created_at=msg.created_at.isoformat(),
                message_type="history"
            )
            await chat_manager.send_to_user(user_id, history_msg)
    except Exception:
        pass
    
    # ========== LOOP DE RECEBIMENTO DE MENSAGENS ==========
    
    try:
        while True:
            # Recebe dados do cliente
            data = await websocket.receive_text()
            
            try:
                message_data = json.loads(data)
            except json.JSONDecodeError:
                error_msg = ChatMessageBroadcast(
                    user_id=0,
                    username="System",
                    message="Invalid message format",
                    created_at=datetime.utcnow().isoformat(),
                    message_type="error"
                )
                await chat_manager.send_to_user(user_id, error_msg)
                continue
            
            message_content = message_data.get("message", "").strip()
            
            # Validação básica
            if not message_content or len(message_content) > 1000:
                error_msg = ChatMessageBroadcast(
                    user_id=0,
                    username="System",
                    message="Message must be between 1 and 1000 characters",
                    created_at=datetime.utcnow().isoformat(),
                    message_type="error"
                )
                await chat_manager.send_to_user(user_id, error_msg)
                continue
            
            # Sanitização básica (remover tags HTML)
            message_content = message_content.replace("<", "&lt;").replace(">", "&gt;")
            
            # Salva no banco de dados
            try:
                from ..schemas.chat_schema import ChatMessageCreate
                chat_msg_create = ChatMessageCreate(message=message_content)
                db_message = create_chat_message(db, user_id, username, chat_msg_create)
                
                # Cria o objeto para broadcast
                broadcast_msg = ChatMessageBroadcast(
                    id=db_message.id,
                    user_id=user_id,
                    username=username,
                    message=message_content,
                    created_at=datetime.utcnow().isoformat(),
                    message_type="message"
                )
                
                # Broadcast para todos
                await chat_manager.broadcast(broadcast_msg)
                
            except Exception as e:
                error_msg = ChatMessageBroadcast(
                    user_id=0,
                    username="System",
                    message="Error saving message",
                    created_at=datetime.utcnow().isoformat(),
                    message_type="error"
                )
                await chat_manager.send_to_user(user_id, error_msg)
    
    # ========== DESCONEXÃO ==========
    
    except WebSocketDisconnect:
        chat_manager.disconnect(user_id)
        leave_msg = ChatMessageBroadcast(
            user_id=0,
            username="System",
            message=f"{username} left the chat",
            created_at=datetime.utcnow().isoformat(),
            message_type="system"
        )
        await chat_manager.broadcast(leave_msg)
    
    except Exception as e:
        chat_manager.disconnect(user_id)
        try:
            await websocket.close(code=status.WS_1011_SERVER_ERROR, reason="Internal server error")
        except:
            pass
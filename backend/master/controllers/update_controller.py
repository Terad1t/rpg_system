from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status, Query, Depends
from sqlalchemy.orm import Session
from database.connection import get_db
from utils.auth_utils import decode_token
from utils.update_manager import update_manager
from services.auth_services import get_user_by_id

router = APIRouter(prefix="/updates", tags=["updates"])

# ========== WEBSOCKET PARA ATUALIZAÇÕES EM TEMPO REAL ==========

@router.websocket("/ws")
async def websocket_updates_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebSocket para receber atualizações em tempo real do Master.

    Query params:
    - token: JWT token de autenticação

    Apenas players podem conectar para receber atualizações.
    Master não precisa conectar (ele dispara as atualizações via API).
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
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Only players can receive real-time updates")
        return

    # ========== VALIDAÇÃO DE USUÁRIO ==========

    user = get_user_by_id(db, user_id)

    if not user or not user.is_active:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User not found or inactive")
        return

    # ========== CONEXÃO ==========

    username = user.login  # Usa o login como username

    await update_manager.connect(websocket, user_id, username)

    try:
        # Mantém a conexão aberta para receber atualizações
        while True:
            # Recebe mensagens do cliente (se necessário, mas principalmente para keep-alive)
            data = await websocket.receive_text()
            # Pode processar mensagens do cliente se necessário (ex: acknowledgments)
            # Por enquanto, apenas mantém a conexão

    except WebSocketDisconnect:
        update_manager.disconnect(user_id)

# ========== ENDPOINT PARA VER USUÁRIOS CONECTADOS ==========

@router.get("/active-users")
def get_active_update_users():
    """Retorna lista de usuários conectados para receber atualizações em tempo real"""
    return {
        "active_users": update_manager.get_active_users(),
        "total": update_manager.get_active_users_count()
    }
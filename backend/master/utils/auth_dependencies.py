from dataclasses import dataclass

from fastapi import Depends, HTTPException, WebSocket, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..database.connection import SessionLocal, get_db
from ..models.user_model import User
from .auth_utils import decode_token, get_websocket_token

security = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    """Usuário autenticado, extraído do JWT e confirmado no banco."""

    user_id: int
    role: str
    login: str = ""

    @property
    def is_master(self) -> bool:
        return self.role == "master"


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def resolve_user_from_token(db: Session, token: str | None) -> CurrentUser | None:
    """Valida o token e confere se o usuário existe e está ativo.

    O papel (role) vem do banco, não do token: se o Master rebaixar ou
    desativar alguém, o token antigo deixa de valer na hora.
    """
    payload = decode_token(token) if token else None
    if payload is None:
        return None
    user = db.get(User, payload["user_id"])
    if not user or not user.is_active:
        return None
    return CurrentUser(user_id=user.id, role=user.role, login=user.login)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> CurrentUser:
    if credentials is None:
        raise _unauthorized("Not authenticated")
    current_user = resolve_user_from_token(db, credentials.credentials)
    if current_user is None:
        raise _unauthorized("Invalid or expired token")
    return current_user


async def get_current_master(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if not current_user.is_master:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Master can access this resource")
    return current_user


async def get_current_player(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if current_user.role != "player":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Players can access this resource")
    return current_user


async def authenticate_websocket(websocket: WebSocket, authorize=None) -> CurrentUser | None:
    """Autentica um WebSocket; fecha a conexão com 1008 e devolve None se falhar.

    `authorize(db, user) -> bool` permite uma checagem extra (ex.: dono do personagem).
    A sessão do banco é fechada antes de devolver: conexões WebSocket duram muito
    e não devem segurar uma conexão do pool.
    """
    with SessionLocal() as db:
        current_user = resolve_user_from_token(db, get_websocket_token(websocket))
        if current_user is not None and authorize is not None and not authorize(db, current_user):
            current_user = None
    if current_user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid or expired token")
    return current_user


def websocket_subprotocol(websocket: WebSocket) -> str | None:
    """Ecoa o subprotocolo `bearer` quando o cliente mandou o token por ele."""
    return "bearer" if websocket.headers.get("sec-websocket-protocol") else None

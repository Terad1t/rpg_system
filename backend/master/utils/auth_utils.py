from datetime import timedelta
from urllib.parse import parse_qs

import jwt
from fastapi import WebSocket
from passlib.context import CryptContext

from ..core.config import get_settings
from ..core.time import utcnow

# pbkdf2_sha256 é usado em vez de bcrypt por compatibilidade (e para não
# invalidar os hashes já gravados no banco).
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

ALGORITHM = "HS256"


# ========== FUNÇÕES DE HASH ==========


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_pin(pin: str) -> str:
    return pwd_context.hash(pin)


def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    return pwd_context.verify(plain_pin, hashed_pin)


# ========== FUNÇÕES DE JWT ==========


def create_access_token(user_id: int, role: str, expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    expire = utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Decodifica o JWT e devolve `{"user_id", "role"}`, ou None se for inválido/expirado."""
    try:
        payload = jwt.decode(token, get_settings().secret_key, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None

    user_id = payload.get("sub")
    role = payload.get("role")
    if user_id is None or role is None:
        return None
    try:
        return {"user_id": int(user_id), "role": role}
    except (TypeError, ValueError):
        return None


def get_websocket_token(websocket: WebSocket) -> str | None:
    """Extrai o JWT do handshake: header Authorization, subprotocolo `bearer, <token>` ou `?token=`."""
    authorization = websocket.headers.get("authorization")
    if authorization:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() == "bearer" and token.strip():
            return token.strip()

    protocol_header = websocket.headers.get("sec-websocket-protocol")
    if protocol_header:
        protocols = [value.strip() for value in protocol_header.split(",") if value.strip()]
        if len(protocols) >= 2 and protocols[0].lower() == "bearer":
            return protocols[1]

    query_string = websocket.scope.get("query_string", b"")
    if isinstance(query_string, bytes):
        query_string = query_string.decode()
    params = parse_qs(query_string)
    token_list = params.get("token") or params.get("access_token")
    return token_list[0] if token_list else None

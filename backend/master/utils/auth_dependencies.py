from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..database.connection import get_db
from .auth_utils import decode_token
from ..services.auth_services import get_user_by_id

security = HTTPBearer()

class CurrentUser:
    """Classe para extrair o usuário autenticado do token"""
    user_id: int
    role: str

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> CurrentUser:
    """Extrai e valida o usuário a partir do token JWT"""
    token = credentials.credentials
    
    payload = decode_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("user_id")
    role = payload.get("role")
    
    user = get_user_by_id(db, user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    current_user = CurrentUser()
    current_user.user_id = user_id
    current_user.role = role
    
    return current_user

async def get_current_master(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Verifica se o usuário autenticado é um Master"""
    if current_user.role != "master":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Master can access this resource"
        )
    
    return current_user

async def get_current_player(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Verifica se o usuário autenticado é um Player"""
    if current_user.role != "player":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Players can access this resource"
        )
    
    return current_user
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# ========== SCHEMAS DE LOGIN ==========

class LoginRequest(BaseModel):
    login: str
    password: str
    pin: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str

# ========== SCHEMAS DE CRIAÇÃO (MASTER ONLY) ==========

class UserCreateByMaster(BaseModel):
    login: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    pin: str = Field(..., min_length=4, max_length=6)
    role: str = Field(..., pattern="^(master|player)$")
    is_active: Optional[bool] = True

class MasterInitialization(BaseModel):
    """Dados para criar o Master inicial do sistema"""
    login: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    pin: str = Field(..., min_length=4, max_length=6)

# ========== SCHEMAS DE LEITURA ==========

class UserRead(BaseModel):
    id: int
    login: str
    role: str
    is_active: bool
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserReadByMaster(UserRead):
    """Master pode ver todos os usuários"""
    pass

# ========== SCHEMAS DE ATUALIZAÇÃO ==========

class UserUpdateByMaster(BaseModel):
    password: Optional[str] = Field(None, min_length=6)
    pin: Optional[str] = Field(None, min_length=4, max_length=6)
    is_active: Optional[bool] = None
    role: Optional[str] = Field(None, pattern="^(master|player)$")
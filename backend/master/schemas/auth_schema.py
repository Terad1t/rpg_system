from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

# ========== SCHEMAS DE LOGIN ==========


class LoginRequest(BaseModel):
    login: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    pin: str = Field(..., min_length=4, max_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: str
    login: str


# ========== SCHEMAS DE CRIAÇÃO (MASTER ONLY) ==========


class UserCreateByMaster(BaseModel):
    login: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    pin: str = Field(..., min_length=4, max_length=6)
    role: str = Field(..., pattern="^(master|player)$")
    is_active: bool | None = True


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
    created_by: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ========== SCHEMAS DE ATUALIZAÇÃO ==========


class UserUpdateByMaster(BaseModel):
    password: str | None = Field(None, min_length=6)
    pin: str | None = Field(None, min_length=4, max_length=6)
    is_active: bool | None = None
    role: str | None = Field(None, pattern="^(master|player)$")

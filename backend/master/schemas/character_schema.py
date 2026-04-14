from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional

# ========== SCHEMAS DO MASTER ==========

_TIPOS = {"player", "npc", "boss"}


class CharacterCreateByMaster(BaseModel):
    """Criação de personagem pelo Master (completo)"""
    name: str = Field(..., min_length=1)
    age: Optional[int] = None
    tipo: str = Field(...)
    raca_id: int = Field(..., ge=1)
    classe_id: int = Field(..., ge=1)
    user_id: Optional[int] = None

    @field_validator("tipo")
    def normalize_tipo(cls, v):
        if v is None:
            raise ValueError("tipo is required and must be one of: player, npc, boss")
        val = str(v).strip().lower()
        if val not in _TIPOS:
            raise ValueError(f"invalid tipo '{v}', expected one of: {_TIPOS}")
        return val

    @field_validator("age")
    def validate_age(cls, v):
        if v is None:
            return v
        if v < 0:
            raise ValueError("age must be >= 0")
        return v

    @model_validator(mode="after")
    def check_player_has_user(self):
        # If this character is a player, user_id must be provided
        if self.tipo == "player" and self.user_id is None:
            raise ValueError("user_id is required when tipo == 'player'")
        return self


class CharacterUpdateByMaster(BaseModel):
    """Atualização pelo Master (permite alterar quase tudo)"""
    name: Optional[str] = Field(None, min_length=1)
    age: Optional[int] = None
    tipo: Optional[str] = None
    raca_id: Optional[int] = None
    classe_id: Optional[int] = None
    user_id: Optional[int] = None

    @field_validator("tipo")
    def normalize_tipo_opt(cls, v):
        if v is None:
            return v
        val = str(v).strip().lower()
        if val not in _TIPOS:
            raise ValueError(f"invalid tipo '{v}', expected one of: {_TIPOS}")
        return val

    @field_validator("age")
    def validate_age_opt(cls, v):
        if v is None:
            return v
        if v < 0:
            raise ValueError("age must be >= 0")
        return v


# ========== SCHEMAS DO PLAYER ==========


class CharacterUpdateByPlayer(BaseModel):
    """Atualização pelo Player (apenas codinome e descrição)"""
    codename: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=2000)


# ========== SCHEMAS DE LEITURA ==========


class CharacterRead(BaseModel):
    id: int
    name: str
    age: Optional[int] = None
    tipo: str
    raca_id: int
    classe_id: int
    codename: Optional[str] = None
    description: Optional[str] = None
    user_id: Optional[int] = None

    class Config:
        from_attributes = True
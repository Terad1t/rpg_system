from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CharacterHabilidadeCreate(BaseModel):
    habilidade_id: int = Field(..., ge=1)


class CharacterHabilidadeRead(BaseModel):
    id: int
    character_id: int
    habilidade_id: int
    assigned_by: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

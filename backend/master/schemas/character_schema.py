from pydantic import BaseModel
from typing import Optional

class CharacterBase(BaseModel):
    name: str
    tipo: str  # player, npc, boss
    raca_id: Optional[int] = None
    classe_id: Optional[int] = None

class CharacterCreate(CharacterBase):
    pass

class CharacterRead(CharacterBase):
    id: int

    class Config:
        from_attributes = True

class CharacterUpdate(BaseModel):
    name: Optional[str] = None
    tipo: Optional[str] = None
    raca_id: Optional[int] = None
    classe_id: Optional[int] = None
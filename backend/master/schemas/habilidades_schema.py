from pydantic import BaseModel
from typing import Optional

class HabilidadeBase(BaseModel):
    name: str
    tipo: str  # classe, raça, item
    custo_vigor: Optional[int] = 0
    custo_vida: Optional[int] = 0
    dano_base: Optional[int] = 0
    efeitos_atributos: Optional[str] = None
    classe_id: Optional[int] = None
    raca_id: Optional[int] = None
    item_id: Optional[int] = None

class HabilidadeCreate(HabilidadeBase):
    pass

class HabilidadeRead(HabilidadeBase):
    id: int

    class Config:
        from_attributes = True

class HabilidadeUpdate(BaseModel):
    name: Optional[str] = None
    tipo: Optional[str] = None
    custo_vigor: Optional[int] = None
    custo_vida: Optional[int] = None
    dano_base: Optional[int] = None
    efeitos_atributos: Optional[str] = None
    classe_id: Optional[int] = None
    raca_id: Optional[int] = None
    item_id: Optional[int] = None
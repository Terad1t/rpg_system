from pydantic import BaseModel
from typing import Optional

# ========== SCHEMAS DO MASTER ==========

class CharacterCreateByMaster(BaseModel):
    """Criação de personagem pelo Master (completo)"""
    name: str  # Imutável
    age: Optional[int] = None  # Imutável
    tipo: str  # player, npc, boss
    raca_id: int  # Imutável
    classe_id: int  # Imutável
    user_id: Optional[str] = None  # Para personagens de player

class CharacterUpdateByMaster(BaseModel):
    """Atualização pelo Master (permite alterar quase tudo)"""
    name: Optional[str] = None
    age: Optional[int] = None
    tipo: Optional[str] = None
    raca_id: Optional[int] = None
    classe_id: Optional[int] = None
    user_id: Optional[str] = None

# ========== SCHEMAS DO PLAYER ==========

class CharacterUpdateByPlayer(BaseModel):
    """Atualização pelo Player (apenas codinome e descrição)"""
    codename: Optional[str] = None  # Editável
    description: Optional[str] = None  # Editável

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
    user_id: Optional[str] = None

    class Config:
        from_attributes = True
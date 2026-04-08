from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from enum import Enum


class HabilidadeTipo(str, Enum):
    RACE = "race"
    ITEM = "item"
    CLASS = "class"


_TIPO_SYNONYMS = {
    "raça": "race",
    "raca": "race",
    "race": "race",
    "item": "item",
    "classe": "class",
    "class": "class",
}


class HabilidadeBase(BaseModel):
    name: str = Field(..., min_length=1)
    tipo: str  # will be normalized to one of HabilidadeTipo
    custo_vigor: Optional[int] = 0
    custo_vida: Optional[int] = 0
    dano_base: Optional[int] = 0
    efeitos_atributos: Optional[str] = None
    classe_id: Optional[int] = None
    raca_id: Optional[int] = None
    item_id: Optional[int] = None

    @field_validator("tipo")
    def normalize_tipo(cls, v):
        if v is None:
            raise ValueError("tipo is required and must be one of: race, item, class")
        key = str(v).strip().lower()
        mapped = _TIPO_SYNONYMS.get(key)
        if not mapped:
            raise ValueError(f"invalid tipo '{v}', expected one of: {list(HabilidadeTipo)}")
        return mapped

    @model_validator(mode="after")
    def check_related_ids(self):
        # After normalization, ensure corresponding relation id exists for the tipo
        tipo = getattr(self, "tipo", None)
        if tipo == HabilidadeTipo.RACE.value and not getattr(self, "raca_id", None):
            raise ValueError("raca_id is required for tipo='race'")
        if tipo == HabilidadeTipo.CLASS.value and not getattr(self, "classe_id", None):
            raise ValueError("classe_id is required for tipo='class'")
        if tipo == HabilidadeTipo.ITEM.value and not getattr(self, "item_id", None):
            raise ValueError("item_id is required for tipo='item'")
        return self


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

    @field_validator("tipo")
    def normalize_tipo_optional(cls, v):
        if v is None:
            return v
        key = str(v).strip().lower()
        mapped = _TIPO_SYNONYMS.get(key)
        if not mapped:
            raise ValueError(f"invalid tipo '{v}', expected one of: {list(HabilidadeTipo)}")
        return mapped

    @model_validator(mode="after")
    def validate_consistency(self):
        # If tipo is being updated, ensure matching id is provided in update payload
        tipo = getattr(self, "tipo", None)
        if tipo == HabilidadeTipo.RACE.value and getattr(self, "raca_id", None) is None:
            raise ValueError("raca_id must be provided when changing tipo to 'race'")
        if tipo == HabilidadeTipo.CLASS.value and getattr(self, "classe_id", None) is None:
            raise ValueError("classe_id must be provided when changing tipo to 'class'")
        if tipo == HabilidadeTipo.ITEM.value and getattr(self, "item_id", None) is None:
            raise ValueError("item_id must be provided when changing tipo to 'item'")
        return self
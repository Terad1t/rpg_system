from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from .habilidades_schema import HabilidadeSummary


class CharacterHabilidadeCreate(BaseModel):
    habilidade_id: int = Field(..., ge=1)


class CharacterHabilidadeRead(BaseModel):
    id: int
    character_id: int
    habilidade_id: int
    assigned_by: int | None = None
    created_at: datetime | None = None
    habilidade: HabilidadeSummary | None = None

    model_config = ConfigDict(from_attributes=True)

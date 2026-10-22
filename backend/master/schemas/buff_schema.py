import json
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BuffBase(BaseModel):
    kind: Literal["buff", "debuff"] = "buff"
    description: str | None = Field(None, max_length=2000)
    effects: Any | None = None
    duration_default_seconds: int | None = Field(None, ge=0, le=7 * 24 * 3600)
    multipliers: dict[str, float] | None = None
    attributes_affected: list[str] | None = None
    stackable: bool = False


class BuffCreate(BuffBase):
    name: str = Field(..., min_length=1, max_length=100)

    @field_validator("name")
    def strip_name(cls, v):
        return v.strip()


class BuffUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    kind: Literal["buff", "debuff"] | None = None
    description: str | None = Field(None, max_length=2000)
    effects: Any | None = None
    duration_default_seconds: int | None = Field(None, ge=0, le=7 * 24 * 3600)
    multipliers: dict[str, float] | None = None
    attributes_affected: list[str] | None = None
    stackable: bool | None = None


# Campos guardados como texto JSON na tabela `buffs`.
JSON_FIELDS = ("effects", "multipliers", "attributes_affected")


class BuffRead(BuffBase):
    id: int
    name: str
    created_at: datetime | None = None
    created_by: int | None = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator(*JSON_FIELDS, mode="before")
    def parse_json_text(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return None
        return v

from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator

from ..core.time import utcnow

_ALLOWED_EVENT_TYPES = {
    "character_updated",
    "attributes_updated",
    "inventory_updated",
    "item_updated",
    "skill_updated",
    "map_updated",
}


class UpdateEvent(BaseModel):
    """Evento de atualização em tempo real"""

    type: str = Field(...)
    data: dict[str, Any]
    timestamp: str | None = None

    @field_validator("type")
    def validate_type(cls, v):
        val = str(v).strip().lower()
        if val not in _ALLOWED_EVENT_TYPES:
            raise ValueError(f"invalid event type '{v}', expected one of: {_ALLOWED_EVENT_TYPES}")
        return val

    @model_validator(mode="after")
    def ensure_timestamp(self):
        if self.timestamp is None:
            self.timestamp = utcnow().isoformat()
        return self


# Tipos específicos de eventos
class CharacterUpdateEvent(UpdateEvent):
    type: str = "character_updated"


class AttributesUpdateEvent(UpdateEvent):
    type: str = "attributes_updated"


class InventoryUpdateEvent(UpdateEvent):
    type: str = "inventory_updated"


class ItemUpdateEvent(UpdateEvent):
    type: str = "item_updated"


class SkillUpdateEvent(UpdateEvent):
    type: str = "skill_updated"


class MapUpdateEvent(UpdateEvent):
    type: str = "map_updated"

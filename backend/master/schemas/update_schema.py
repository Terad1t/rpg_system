from pydantic import BaseModel
from typing import Any, Dict
from datetime import datetime

class UpdateEvent(BaseModel):
    """Evento de atualização em tempo real"""
    type: str  # Ex: "character_updated", "attributes_updated", etc.
    data: Dict[str, Any]  # Dados da atualização
    timestamp: str = None  # Timestamp da atualização

    def __init__(self, **data):
        super().__init__(**data)
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat()

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
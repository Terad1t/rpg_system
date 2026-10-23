"""Importa todos os modelos para registrá-los em `Base.metadata`."""

from .attribute_distribution_log_model import AttributeDistributionLog
from .attribute_model import Attribute
from .batalha_model import Batalha
from .batalha_participante_model import BatalhaParticipante
from .buff_debuff_model import BuffDebuff
from .character_attribute_model import CharacterAttribute
from .character_habilidade_model import CharacterHabilidade
from .character_model import Character
from .character_request_model import CharacterRequest
from .chat_message_model import ChatMessage
from .classe_model import Classe
from .country_model import Country
from .fight_entry_model import FightEntry
from .fight_invite_model import FightInvite
from .fight_model import Fight
from .fight_participant_model import FightParticipant
from .fight_turn_model import FightTurn
from .habilidades_model import Habilidade
from .inventario_model import Inventario
from .inventory_log_model import InventoryLog
from .item_model import Item
from .map_model import Map
from .master_audit_model import MasterAudit
from .player_notes_model import PlayerNote
from .raca_bonus_model import RacaBonus
from .raca_model import Raca
from .region_model import Region
from .user_model import User
from .village_model import Village

__all__ = [
    "Attribute",
    "AttributeDistributionLog",
    "Batalha",
    "BatalhaParticipante",
    "BuffDebuff",
    "Character",
    "CharacterAttribute",
    "CharacterHabilidade",
    "CharacterRequest",
    "ChatMessage",
    "Classe",
    "Country",
    "Fight",
    "FightEntry",
    "FightInvite",
    "FightParticipant",
    "FightTurn",
    "Habilidade",
    "Inventario",
    "InventoryLog",
    "Item",
    "Map",
    "MasterAudit",
    "PlayerNote",
    "RacaBonus",
    "Raca",
    "Region",
    "User",
    "Village",
]

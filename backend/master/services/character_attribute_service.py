from sqlalchemy.orm import Session

from ..models.attribute_distribution_log_model import AttributeDistributionLog
from ..models.character_attribute_model import CharacterAttribute
from ..models.character_model import Character
from ..models.raca_bonus_model import RacaBonus

ALLOWED_ATTRIBUTES = {
    "strength",
    "defense",
    "hp",
    "energy",
    "healing",
    "magic",
    "mana",
    "occultism",
    "intelligence",
    "intellect",
    "speed",
    "damage",
    "agility",
    "vigor",
    "charisma",
    "presence",
    "investigation",
}

# Valor máximo de um atributo (base + pontos distribuídos), sem contar equipamento e buffs.
MAX_ATTRIBUTE_VALUE = 100


def attribute_total(attr: CharacterAttribute) -> int:
    """Valor final do atributo: (base + distribuídos + equipamento) x multiplicador de buff."""
    return int((attr.base_value + attr.distributed_points + (attr.equipment_bonus or 0)) * (attr.buff_multiplier or 1.0))


def serialize_attributes(attrs: list[CharacterAttribute]) -> list[dict]:
    return [
        {
            "attribute_name": a.attribute_name,
            "base_value": a.base_value,
            "distributed_points": a.distributed_points,
            "equipment_bonus": a.equipment_bonus,
            "buff_multiplier": a.buff_multiplier,
            "total_value": attribute_total(a),
        }
        for a in attrs
    ]


def initialize_character_attributes(
    db: Session,
    character_id: int,
    base_attrs: dict[str, int],
    investigation_value: int = 0,
    race_id: int | None = None,
) -> None:
    """Cria as linhas de atributo do personagem já somando o bônus da raça.

    Não faz commit: quem chama decide a transação.
    """
    bonus_map: dict[str, int] = {}
    if race_id:
        for bonus in db.query(RacaBonus).filter(RacaBonus.raca_id == race_id).all():
            bonus_map[bonus.attribute_name] = bonus_map.get(bonus.attribute_name, 0) + bonus.bonus

    values = {name: base for name, base in base_attrs.items() if name in ALLOWED_ATTRIBUTES}
    values["investigation"] = investigation_value

    for name, base in values.items():
        db.add(
            CharacterAttribute(
                character_id=character_id,
                attribute_name=name,
                base_value=int(base + bonus_map.get(name, 0)),
                distributed_points=0,
                equipment_bonus=0,
                buff_multiplier=1.0,
            )
        )
    db.flush()


def distribute_points(
    db: Session, character_id: int, user_id: int, attribute_name: str, points_to_add: int
) -> CharacterAttribute:
    """Gasta pontos livres do personagem em um atributo. Levanta ValueError com o motivo."""
    if attribute_name not in ALLOWED_ATTRIBUTES:
        raise ValueError("Invalid attribute")
    if points_to_add <= 0:
        raise ValueError("points_to_add must be positive")

    character = db.get(Character, character_id)
    if not character:
        raise ValueError("Character not found")

    char_attr = (
        db.query(CharacterAttribute)
        .filter(CharacterAttribute.character_id == character_id, CharacterAttribute.attribute_name == attribute_name)
        .first()
    )
    if not char_attr:
        raise ValueError("Attribute not found")

    if (character.free_points or 0) < points_to_add:
        raise ValueError("Not enough free points")

    old = char_attr.distributed_points
    new = old + points_to_add
    if char_attr.base_value + new > MAX_ATTRIBUTE_VALUE:
        raise ValueError("Attribute value would exceed maximum")

    char_attr.distributed_points = new
    character.free_points = (character.free_points or 0) - points_to_add
    character.total_points_distributed = (character.total_points_distributed or 0) + points_to_add

    db.add(
        AttributeDistributionLog(
            character_id=character_id,
            user_id=user_id,
            attribute_name=attribute_name,
            old_value=old,
            new_value=new,
            operation="add",
        )
    )
    db.commit()
    db.refresh(char_attr)
    return char_attr

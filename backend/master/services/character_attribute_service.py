from sqlalchemy.orm import Session
from ..models.character_attribute_model import CharacterAttribute
from ..models.attribute_distribution_log_model import AttributeDistributionLog
from ..models.raca_bonus_model import RacaBonus
from datetime import datetime
from typing import Dict, List


ALLOWED_ATTRIBUTES = {
    'strength', 'defense', 'hp', 'energy',
    'healing', 'magic', 'mana', 'occultism', 'intelligence',
    'speed', 'damage', 'agility', 'vigor', 'charisma', 'presence', 'investigation'
}


def initialize_character_attributes(db: Session, character_id: int, base_attrs: Dict, investigation_value: int = 0, race_id: int | None = None):
    # Gather race bonuses (if any)
    bonus_map = {}
    if race_id:
        bonuses = db.query(RacaBonus).filter(RacaBonus.raca_id == race_id).all()
        for b in bonuses:
            bonus_map.setdefault(b.attribute_name, 0)
            bonus_map[b.attribute_name] += b.bonus

    # create rows
    for name, base in base_attrs.items():
        if name not in ALLOWED_ATTRIBUTES:
            continue
        final_value = int(base + bonus_map.get(name, 0))
        attr = CharacterAttribute(
            character_id=character_id,
            attribute_name=name,
            base_value=final_value,
            distributed_points=0,
            equipment_bonus=0,
            buff_multiplier=1.0,
        )
        db.add(attr)

    # investigation
    if 'investigation' in ALLOWED_ATTRIBUTES:
        inv_final = int(investigation_value + bonus_map.get('investigation', 0))
        db.add(CharacterAttribute(character_id=character_id, attribute_name='investigation', base_value=inv_final))

    db.commit()


def distribute_points(db: Session, character_id: int, user_id: int, attribute_name: str, points_to_add: int):
    # basic validations
    if attribute_name not in ALLOWED_ATTRIBUTES:
        raise ValueError('Invalid attribute')

    char_attr = db.query(CharacterAttribute).filter(
        CharacterAttribute.character_id == character_id,
        CharacterAttribute.attribute_name == attribute_name
    ).first()
    if not char_attr:
        raise ValueError('Attribute not found')

    # load character free_points
    from ..models.character_model import Character
    character = db.query(Character).filter(Character.id == character_id).first()
    if not character:
        raise ValueError('Character not found')

    if points_to_add > 0:
        if character.free_points is None or character.free_points < points_to_add:
            raise ValueError('Not enough free points')
    # apply
    old = char_attr.distributed_points
    new = max(0, old + points_to_add)
    # enforce per-attribute max (50)
    if new - char_attr.distributed_points + char_attr.base_value > 100:
        raise ValueError('Attribute value would exceed maximum')

    char_attr.distributed_points = new
    # update character free_points and total
    character.free_points = (character.free_points or 0) - max(0, points_to_add)
    character.total_points_distributed = (character.total_points_distributed or 0) + max(0, points_to_add)

    # log
    log = AttributeDistributionLog(
        character_id=character_id,
        user_id=user_id,
        attribute_name=attribute_name,
        old_value=old,
        new_value=new,
        operation='add' if points_to_add > 0 else 'remove',
    )
    db.add(log)

    db.commit()
    db.refresh(char_attr)
    return char_attr

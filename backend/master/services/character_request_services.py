from sqlalchemy.orm import Session
from ..models.character_request_model import CharacterRequest
from ..models.character_model import Character
from ..models.attribute_model import Attribute
from ..models.raca_bonus_model import RacaBonus
from datetime import datetime
from typing import Dict


INVESTIGATION_MAP = {
    "basic": 0,
    "intermediate": 1,
    "advanced": 2,
    "forensic": 3,
}


def create_character_request(db: Session, user_id: int, payload: Dict):
    req = CharacterRequest(user_id=user_id, **payload)
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


def get_requests(db: Session, status: str | None = None, skip: int = 0, limit: int = 100):
    q = db.query(CharacterRequest)
    if status:
        q = q.filter(CharacterRequest.status == status)
    return q.offset(skip).limit(limit).all()


def get_request_by_id(db: Session, request_id: int):
    return db.query(CharacterRequest).filter(CharacterRequest.id == request_id).first()


def approve_request(db: Session, request_id: int, approval_data: Dict, master_user_id: int):
    req = db.query(CharacterRequest).filter(CharacterRequest.id == request_id).first()
    if not req or req.status != "pending":
        return None

    # Create Character
    character = Character(
        name=req.name,
        age=req.age,
        tipo="player",
        raca_id=req.raca_id,
        classe_id=req.classe_id,
        codename=req.codename or req.name,
        description=req.description,
        user_id=req.user_id,
        subclass=approval_data.get("subclass"),
    )
    db.add(character)
    db.commit()
    db.refresh(character)

    # Apply attributes with race bonuses
    base_attrs = {
        "hp": approval_data.get("hp", 0),
        "vigor": approval_data.get("vigor", 0),
        "agility": approval_data.get("agility", 0),
        "speed": approval_data.get("speed", 0),
        "charisma": approval_data.get("charisma", 0),
        "intellect": approval_data.get("intellect", 0),
        "presence": approval_data.get("presence", 0),
        "occultism": approval_data.get("occultism", 0),
    }

    # Investigation is an enumerated string → map to integer
    investigation_raw = approval_data.get("investigation")
    investigation_value = INVESTIGATION_MAP.get(investigation_raw, 0)

    # Gather race bonuses
    bonuses = db.query(RacaBonus).filter(RacaBonus.raca_id == character.raca_id).all()
    bonus_map = {}
    for b in bonuses:
        bonus_map.setdefault(b.attribute_name, 0)
        bonus_map[b.attribute_name] += b.bonus

    # Create Attribute rows
    for name, base in base_attrs.items():
        final_value = base + bonus_map.get(name, 0)
        attr = Attribute(character_id=character.id, name=name, value=final_value)
        db.add(attr)

    # investigation attribute
    inv_final = investigation_value + bonus_map.get("investigation", 0)
    db.add(Attribute(character_id=character.id, name="investigation", value=inv_final))

    # finalize request
    req.status = "approved"
    req.approved_by = master_user_id
    req.approved_at = datetime.utcnow()

    db.commit()
    return character

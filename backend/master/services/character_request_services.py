from sqlalchemy.orm import Session
from ..models.character_request_model import CharacterRequest
from ..models.character_model import Character
from ..models.attribute_model import Attribute
from ..models.raca_bonus_model import RacaBonus
from ..models.raca_model import Raca
from ..models.classe_model import Classe
from datetime import datetime, timedelta
from typing import Dict


INVESTIGATION_MAP = {
    "basic": 0,
    "intermediate": 1,
    "advanced": 2,
    "forensic": 3,
}


def expire_pending_requests(db: Session, now: datetime | None = None, ttl_days: int = 2) -> int:
    """Marca como rejeitadas as requisições pendentes mais antigas que `ttl_days`."""
    now = now or datetime.utcnow()
    cutoff = now - timedelta(days=ttl_days)

    updated = (
        db.query(CharacterRequest)
        .filter(CharacterRequest.status == "pending")
        .filter(CharacterRequest.created_at < cutoff)
        .update({CharacterRequest.status: "rejected"}, synchronize_session=False)
    )
    if updated:
        db.commit()
    return int(updated or 0)


def create_character_request(db: Session, user_id: int, payload: Dict):
    # Aplica expiração antes de criar (mantém a fila limpa)
    expire_pending_requests(db)

    req = CharacterRequest(user_id=user_id, **payload)
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


def get_requests(db: Session, status: str | None = None, skip: int = 0, limit: int = 100):
    # Expira automaticamente pendências antigas
    expire_pending_requests(db)

    q = db.query(CharacterRequest)
    if status:
        q = q.filter(CharacterRequest.status == status)
    return q.offset(skip).limit(limit).all()


def get_request_by_id(db: Session, request_id: int):
    return db.query(CharacterRequest).filter(CharacterRequest.id == request_id).first()


def approve_request(db: Session, request_id: int, approval_data: Dict, master_user_id: int):
    # Expira automaticamente pendências antigas antes de aprovar
    expire_pending_requests(db)

    req = db.query(CharacterRequest).filter(CharacterRequest.id == request_id).first()
    if not req or req.status != "pending":
        return None

    # ensure referenced race and class exist
    raca = db.query(Raca).filter(Raca.id == req.raca_id).first()
    if not raca:
        return None
    classe = db.query(Classe).filter(Classe.id == req.classe_id).first()
    if not classe:
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
        free_points=10,
        total_points_distributed=0,
    )
    db.add(character)
    db.commit()
    db.refresh(character)

    # Initialize attributes using character_attribute_service
    from ..services.character_attribute_service import initialize_character_attributes

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

    investigation_raw = approval_data.get("investigation")
    investigation_value = INVESTIGATION_MAP.get(investigation_raw, 0)

    initialize_character_attributes(db, character.id, base_attrs, investigation_value, character.raca_id)

    # finalize request
    req.status = "approved"
    req.approved_by = master_user_id
    req.approved_at = datetime.utcnow()

    db.commit()
    return character

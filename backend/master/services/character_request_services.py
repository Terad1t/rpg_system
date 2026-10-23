from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from ..core.time import utcnow
from ..models.character_model import Character
from ..models.character_request_model import CharacterRequest
from ..models.classe_model import Classe
from ..models.raca_model import Raca
from .character_attribute_service import initialize_character_attributes

STARTING_FREE_POINTS = 10
APPROVAL_ATTRIBUTES = ("hp", "vigor", "agility", "speed", "charisma", "intellect", "presence", "occultism")

INVESTIGATION_MAP = {
    "basic": 0,
    "intermediate": 1,
    "advanced": 2,
    "forensic": 3,
}


def expire_pending_requests(db: Session, now: datetime | None = None, ttl_days: int = 2) -> int:
    """Marca como rejeitadas as requisições pendentes mais antigas que `ttl_days`."""
    now = now or utcnow()
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


def create_character_request(db: Session, user_id: int, payload: dict):
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


def approve_request(db: Session, request_id: int, approval_data: dict, master_user_id: int) -> Character | None:
    """Cria o personagem a partir da solicitação pendente, tudo numa única transação."""
    expire_pending_requests(db)

    req = db.query(CharacterRequest).filter(CharacterRequest.id == request_id).first()
    if not req or req.status != "pending":
        return None
    if not db.get(Raca, req.raca_id) or not db.get(Classe, req.classe_id):
        return None

    hp = int(approval_data.get("hp", 1))
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
        hp=hp,
        max_hp=hp,
        mana=0,
        max_mana=0,
        free_points=STARTING_FREE_POINTS,
        total_points_distributed=0,
    )
    db.add(character)
    db.flush()

    base_attrs = {name: approval_data.get(name, 0) for name in APPROVAL_ATTRIBUTES}
    investigation_value = INVESTIGATION_MAP.get(approval_data.get("investigation"), 0)
    initialize_character_attributes(db, character.id, base_attrs, investigation_value, character.raca_id)

    req.status = "approved"
    req.approved_by = master_user_id
    req.approved_at = utcnow()

    db.commit()
    db.refresh(character)
    return character

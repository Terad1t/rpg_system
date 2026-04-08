from sqlalchemy.orm import Session
from ..models.character_habilidade_model import CharacterHabilidade
from ..models.habilidades_model import Habilidade
from ..models.character_model import Character
from ..models.inventario_model import Inventario


def assign_skill_to_character(db: Session, character_id: int, habilidade_id: int, assigned_by: int | None = None):
    habilidade = db.query(Habilidade).filter(Habilidade.id == habilidade_id).first()
    character = db.query(Character).filter(Character.id == character_id).first()

    if not habilidade or not character:
        return None

    # Race restriction
    if habilidade.raca_id is not None and habilidade.raca_id != character.raca_id:
        return None

    # Class restriction
    if habilidade.classe_id is not None and habilidade.classe_id != character.classe_id:
        return None

    # Item restriction: ensure character owns the item
    if habilidade.item_id is not None:
        inv = db.query(Inventario).filter(
            Inventario.character_id == character_id,
            Inventario.item_id == habilidade.item_id,
            Inventario.quantidade > 0,
        ).first()
        if not inv:
            return None

    # Create assignment
    assigned = CharacterHabilidade(character_id=character_id, habilidade_id=habilidade_id, assigned_by=assigned_by)
    db.add(assigned)
    db.commit()
    db.refresh(assigned)
    return assigned


def unassign_skill(db: Session, character_id: int, habilidade_id: int):
    assigned = db.query(CharacterHabilidade).filter(
        CharacterHabilidade.character_id == character_id,
        CharacterHabilidade.habilidade_id == habilidade_id,
    ).first()
    if not assigned:
        return None
    db.delete(assigned)
    db.commit()
    return assigned


def get_assigned_skills(db: Session, character_id: int):
    return db.query(CharacterHabilidade).filter(CharacterHabilidade.character_id == character_id).all()

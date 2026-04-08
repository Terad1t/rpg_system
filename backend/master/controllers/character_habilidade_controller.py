from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..schemas.character_habilidade_schema import CharacterHabilidadeCreate, CharacterHabilidadeRead
from ..services.character_habilidade_services import (
    assign_skill_to_character,
    unassign_skill,
    get_assigned_skills,
)
from ..utils.auth_dependencies import get_current_master, get_current_user
from ..models.character_model import Character

router = APIRouter(prefix="/characters/{character_id}/habilidades", tags=["character-habilidades"])


@router.post("/", response_model=CharacterHabilidadeRead)
def assign_skill(character_id: int, payload: CharacterHabilidadeCreate, db: Session = Depends(get_db), current_master = Depends(get_current_master)):
    assigned = assign_skill_to_character(db, character_id=character_id, habilidade_id=payload.habilidade_id, assigned_by=int(current_master.user_id))
    if not assigned:
        raise HTTPException(status_code=400, detail="Invalid assignment (race/class/item restriction or missing entities)")
    return assigned


@router.delete("/{habilidade_id}")
def unassign(character_id: int, habilidade_id: int, db: Session = Depends(get_db), current_master = Depends(get_current_master)):
    removed = unassign_skill(db, character_id=character_id, habilidade_id=habilidade_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"message": "Unassigned"}


@router.get("/", response_model=list[CharacterHabilidadeRead])
def list_assigned(character_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # allow master or owner of character
    char = db.query(Character).filter(Character.id == character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")

    if current_user.role != "master" and int(current_user.user_id) != int(char.user_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    return get_assigned_skills(db, character_id=character_id)

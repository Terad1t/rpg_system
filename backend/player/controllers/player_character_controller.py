import sys
sys.path.insert(0, '../../')

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...master.database.connection import get_db
from ...master.schemas.character_schema import CharacterRead, CharacterUpdateByPlayer
from ...master.utils.auth_dependencies import get_current_player, CurrentUser
from ..services.player_character_services import (
    get_player_character,
    update_player_character,
    get_all_player_characters,
)

router = APIRouter(prefix="/my-characters", tags=["player"])

@router.get("/", response_model=list[CharacterRead])
def read_my_characters(current_player: CurrentUser = Depends(get_current_player), db: Session = Depends(get_db)):
    """Obtém todos os personagens do player autenticado"""
    user_id = str(current_player.user_id)
    characters = get_all_player_characters(db, user_id=user_id)
    if not characters:
        raise HTTPException(status_code=404, detail="No characters found")
    return characters

@router.get("/{character_id}", response_model=CharacterRead)
def read_my_character(character_id: int, current_player: CurrentUser = Depends(get_current_player), db: Session = Depends(get_db)):
    """Obtém um personagem específico do player"""
    user_id = str(current_player.user_id)
    db_character = get_player_character(db, character_id=character_id, user_id=user_id)
    if db_character is None:
        raise HTTPException(status_code=403, detail="You don't have permission to access this character")
    return db_character

@router.put("/{character_id}", response_model=CharacterRead)
def update_my_character(
    character_id: int,
    character_update: CharacterUpdateByPlayer,
    current_player: CurrentUser = Depends(get_current_player),
    db: Session = Depends(get_db)
):
    """Atualiza apenas codinome e descrição do personagem"""
    user_id = str(current_player.user_id)
    db_character = update_player_character(db, character_id=character_id, user_id=user_id, character_update=character_update)
    if db_character is None:
        raise HTTPException(status_code=403, detail="You don't have permission to edit this character")
    return db_character
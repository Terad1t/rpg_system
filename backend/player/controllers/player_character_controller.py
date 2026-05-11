import sys
sys.path.insert(0, '../../')

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
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


@router.post("/{character_id}/portrait")
def upload_portrait(character_id: int, file: UploadFile = File(...), current_player: CurrentUser = Depends(get_current_player), db: Session = Depends(get_db)):
    """Faz upload de um arquivo de portrait e atualiza o personagem"""
    import os
    from shutil import copyfileobj
    from ...master.models.character_model import Character

    user_id = int(current_player.user_id)
    character = db.query(Character).filter(Character.id == character_id, Character.user_id == user_id).first()
    if not character:
        raise HTTPException(status_code=403, detail="You don't have permission to edit this character")

    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), 'master', 'static', 'uploads', 'portraits')
    os.makedirs(uploads_dir, exist_ok=True)

    filename = f"char_{character_id}_{int(__import__('time').time())}_{file.filename}"
    dest_path = os.path.join(uploads_dir, filename)
    try:
        with open(dest_path, 'wb') as out_file:
            copyfileobj(file.file, out_file)
        # store a relative path to the file
        character.portrait = f"/static/uploads/portraits/{filename}"
        db.add(character)
        db.commit()
        db.refresh(character)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"ok": True, "portrait": character.portrait}

@router.get("/", response_model=list[CharacterRead])
def read_my_characters(current_player: CurrentUser = Depends(get_current_player), db: Session = Depends(get_db)):
    """Obtém todos os personagens do player autenticado"""
    user_id = int(current_player.user_id)
    characters = get_all_player_characters(db, user_id=user_id)
    if not characters:
        raise HTTPException(status_code=404, detail="No characters found")
    return characters

@router.get("/{character_id}", response_model=CharacterRead)
def read_my_character(character_id: int, current_player: CurrentUser = Depends(get_current_player), db: Session = Depends(get_db)):
    """Obtém um personagem específico do player"""
    user_id = int(current_player.user_id)
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
    user_id = int(current_player.user_id)
    db_character = update_player_character(db, character_id=character_id, user_id=user_id, character_update=character_update)
    if db_character is None:
        raise HTTPException(status_code=403, detail="You don't have permission to edit this character")
    return db_character
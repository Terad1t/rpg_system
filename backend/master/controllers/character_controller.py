from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from schemas.character_schema import CharacterCreate, CharacterRead, CharacterUpdate
from services.character_services import (
    get_characters,
    get_character_by_id,
    create_character,
    update_character,
    delete_character,
)

router = APIRouter(prefix="/characters", tags=["characters"])

@router.get("/", response_model=list[CharacterRead])
def read_characters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    characters = get_characters(db, skip=skip, limit=limit)
    return characters

@router.get("/{character_id}", response_model=CharacterRead)
def read_character(character_id: int, db: Session = Depends(get_db)):
    db_character = get_character_by_id(db, character_id=character_id)
    if db_character is None:
        raise HTTPException(status_code=404, detail="Character not found")
    return db_character

@router.post("/", response_model=CharacterRead)
def create_new_character(character: CharacterCreate, db: Session = Depends(get_db)):
    return create_character(db=db, character=character)

@router.put("/{character_id}", response_model=CharacterRead)
def update_existing_character(character_id: int, character: CharacterUpdate, db: Session = Depends(get_db)):
    db_character = update_character(db, character_id=character_id, character_update=character)
    if db_character is None:
        raise HTTPException(status_code=404, detail="Character not found")
    return db_character

@router.delete("/{character_id}")
def delete_existing_character(character_id: int, db: Session = Depends(get_db)):
    db_character = delete_character(db, character_id=character_id)
    if db_character is None:
        raise HTTPException(status_code=404, detail="Character not found")
    return {"message": "Character deleted successfully"}
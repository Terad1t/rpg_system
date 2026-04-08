from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..schemas.character_schema import CharacterCreateByMaster, CharacterRead, CharacterUpdateByMaster
from ..schemas.update_schema import CharacterUpdateEvent
from ..utils.broadcast import broadcast_manager
from ..services.character_services import (
    get_characters,
    get_character_by_id,
    create_character,
    update_character,
    delete_character,
)
from ..models.raca_model import Raca
from ..models.classe_model import Classe
from ..models.user_model import User

router = APIRouter(prefix="/characters", tags=["master - characters"])

@router.get("/", response_model=list[CharacterRead])
def read_characters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lista todos os personagens (Master only)"""
    characters = get_characters(db, skip=skip, limit=limit)
    return characters

@router.get("/{character_id}", response_model=CharacterRead)
def read_character(character_id: int, db: Session = Depends(get_db)):
    """Obtém um personagem específico (Master only)"""
    db_character = get_character_by_id(db, character_id=character_id)
    if db_character is None:
        raise HTTPException(status_code=404, detail="Character not found")
    return db_character

@router.post("/", response_model=CharacterRead)
async def create_new_character(character: CharacterCreateByMaster, db: Session = Depends(get_db)):
    """Cria um novo personagem (Master only)"""
    # Referential checks before creation
    raca = db.query(Raca).filter(Raca.id == character.raca_id).first()
    if not raca:
        raise HTTPException(status_code=404, detail="Race (raca) not found")
    classe = db.query(Classe).filter(Classe.id == character.classe_id).first()
    if not classe:
        raise HTTPException(status_code=404, detail="Class (classe) not found")
    if character.user_id:
        user = db.query(User).filter(User.id == character.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

    db_character = create_character(db=db, character=character)
    
    # Emite evento em tempo real
    event = CharacterUpdateEvent(
        data={
            "action": "created",
            "character": db_character.model_dump()
        }
    )
    await broadcast_manager.broadcast(event)
    
    return db_character

@router.put("/{character_id}", response_model=CharacterRead)
async def update_existing_character(character_id: int, character: CharacterUpdateByMaster, db: Session = Depends(get_db)):
    """Atualiza um personagem (Master only)"""
    db_character = update_character(db, character_id=character_id, character_update=character)
    if db_character is None:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Emite evento em tempo real
    event = CharacterUpdateEvent(
        data={
            "action": "updated",
            "character_id": character_id,
            "character": db_character.model_dump()
        }
    )
    await broadcast_manager.broadcast(event)
    
    return db_character

@router.delete("/{character_id}")
async def delete_existing_character(character_id: int, db: Session = Depends(get_db)):
    """Deleta um personagem (Master only)"""
    db_character = delete_character(db, character_id=character_id)
    if db_character is None:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Emite evento em tempo real
    event = CharacterUpdateEvent(
        data={
            "action": "deleted",
            "character_id": character_id
        }
    )
    await broadcast_manager.broadcast(event)
    
    return {"message": "Character deleted successfully"}
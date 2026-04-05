from sqlalchemy.orm import Session
from models.character_model import Character
from schemas.character_schema import CharacterCreateByMaster, CharacterUpdateByMaster

def get_characters(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Character).offset(skip).limit(limit).all()

def get_character_by_id(db: Session, character_id: int):
    return db.query(Character).filter(Character.id == character_id).first()

def create_character(db: Session, character: CharacterCreateByMaster):
    db_character = Character(**character.model_dump())
    db.add(db_character)
    db.commit()
    db.refresh(db_character)
    return db_character

def update_character(db: Session, character_id: int, character_update: CharacterUpdateByMaster):
    db_character = db.query(Character).filter(Character.id == character_id).first()
    if db_character:
        for key, value in character_update.model_dump(exclude_unset=True).items():
            setattr(db_character, key, value)
        db.commit()
        db.refresh(db_character)
    return db_character

def delete_character(db: Session, character_id: int):
    db_character = db.query(Character).filter(Character.id == character_id).first()
    if db_character:
        db.delete(db_character)
        db.commit()
    return db_character
import sys
sys.path.insert(0, '../../')

from sqlalchemy.orm import Session
from ...master.models.character_model import Character
from ...master.schemas.character_schema import CharacterUpdateByPlayer

def get_player_character(db: Session, character_id: int, user_id: str):
    """Obtém o personagem do player (verifica permissão)"""
    db_character = db.query(Character).filter(
        Character.id == character_id,
        Character.user_id == user_id
    ).first()
    return db_character

def update_player_character(db: Session, character_id: int, user_id: str, character_update: CharacterUpdateByPlayer):
    """Atualiza apenas codinome e descrição do personagem do player"""
    db_character = get_player_character(db, character_id, user_id)
    
    if db_character:
        # Permite apenas edição de codinome e descrição
        if character_update.codename is not None:
            db_character.codename = character_update.codename
        if character_update.description is not None:
            db_character.description = character_update.description
        
        db.commit()
        db.refresh(db_character)
    
    return db_character

def get_all_player_characters(db: Session, user_id: str):
    """Obtém todos os personagens do player"""
    return db.query(Character).filter(Character.user_id == user_id).all()
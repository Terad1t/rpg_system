from sqlalchemy.orm import Session

from ...master.models.character_model import Character
from ...master.schemas.character_schema import CharacterUpdateByPlayer


def get_player_character(db: Session, character_id: int, user_id: int) -> Character | None:
    """Personagem do jogador, ou None se não existir ou for de outra pessoa."""
    return db.query(Character).filter(Character.id == character_id, Character.user_id == user_id).first()


def update_player_character(db: Session, character_id: int, user_id: int, character_update: CharacterUpdateByPlayer):
    character = get_player_character(db, character_id, user_id)
    if character is None:
        return None
    for field, value in character_update.model_dump(exclude_unset=True).items():
        setattr(character, field, value)
    db.commit()
    db.refresh(character)
    return character


def get_all_player_characters(db: Session, user_id: int) -> list[Character]:
    return db.query(Character).filter(Character.user_id == user_id).order_by(Character.id.asc()).all()

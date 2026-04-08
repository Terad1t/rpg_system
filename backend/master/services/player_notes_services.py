from sqlalchemy.orm import Session
from ..models.player_notes_model import PlayerNote


def get_note_by_user(db: Session, user_id: int):
    return db.query(PlayerNote).filter(PlayerNote.user_id == user_id).first()


def upsert_note(db: Session, user_id: int, content: str):
    note = db.query(PlayerNote).filter(PlayerNote.user_id == user_id).first()
    if note:
        note.content = content
        db.commit()
        db.refresh(note)
        return note

    note = PlayerNote(user_id=user_id, content=content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

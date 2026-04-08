from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..schemas.player_notes_schema import PlayerNoteCreate, PlayerNoteRead
from ..services.player_notes_services import get_note_by_user, upsert_note
from ..utils.auth_dependencies import get_current_player

router = APIRouter(prefix="/notes", tags=["player-notes"])


@router.get("/", response_model=PlayerNoteRead)
def read_my_note(current_player = Depends(get_current_player), db: Session = Depends(get_db)):
    user_id = int(current_player.user_id)
    note = get_note_by_user(db, user_id=user_id)
    if not note:
        # return empty note structure
        return PlayerNoteRead(id=0, user_id=user_id, content=None)
    return note


@router.put("/", response_model=PlayerNoteRead)
def update_my_note(payload: PlayerNoteCreate, current_player = Depends(get_current_player), db: Session = Depends(get_db)):
    user_id = int(current_player.user_id)
    note = upsert_note(db, user_id=user_id, content=payload.content)
    return note

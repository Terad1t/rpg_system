from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..models import Character, CharacterRequest, Fight, Item, User
from ..utils.auth_dependencies import get_current_master

router = APIRouter(prefix="/master/overview", tags=["master"], dependencies=[Depends(get_current_master)])


@router.get("/")
def read_overview(db: Session = Depends(get_db)):
    """Totais para os cartões do painel do Master."""

    def count(model, *filters) -> int:
        return db.query(func.count(model.id)).filter(*filters).scalar() or 0

    return {
        "players": count(User, User.role == "player", User.is_active.is_(True)),
        "characters": count(Character),
        "player_characters": count(Character, Character.tipo == "player"),
        "items": count(Item),
        "fights": count(Fight),
        "pending_requests": count(CharacterRequest, CharacterRequest.status == "pending"),
    }

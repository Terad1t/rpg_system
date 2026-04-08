from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..schemas.character_request_schema import (
    CharacterRequestCreate,
    CharacterRequestRead,
    CharacterApproval,
)
from ..services.character_request_services import (
    create_character_request,
    get_requests,
    get_request_by_id,
    approve_request,
)
from ..models.character_request_model import CharacterRequest
from ..utils.auth_dependencies import get_current_player, get_current_master, get_current_user
from ..schemas.update_schema import CharacterUpdateEvent
from ..utils.update_manager import update_manager

router = APIRouter(prefix="/characters/requests", tags=["character-requests"])


@router.post("/", response_model=CharacterRequestRead)
def create_request(payload: CharacterRequestCreate, current_player = Depends(get_current_player), db: Session = Depends(get_db)):
    user_id = int(current_player.user_id)
    req = create_character_request(db, user_id=user_id, payload=payload.model_dump())
    return req


@router.get("/my", response_model=list[CharacterRequestRead])
def my_requests(current_player = Depends(get_current_player), db: Session = Depends(get_db)):
    user_id = int(current_player.user_id)
    return db.query(CharacterRequest).filter(CharacterRequest.user_id == user_id).all()


# Master endpoints
@router.get("/", response_model=list[CharacterRequestRead])
def list_requests(status: str | None = None, db: Session = Depends(get_db), current_master = Depends(get_current_master)):
    return get_requests(db, status=status)


@router.post("/{request_id}/approve")
async def approve(request_id: int, approval: CharacterApproval, db: Session = Depends(get_db), current_master = Depends(get_current_master)):
    master_id = int(current_master.user_id)
    character = approve_request(db, request_id=request_id, approval_data=approval.model_dump(), master_user_id=master_id)
    if character is None:
        raise HTTPException(status_code=404, detail="Request not found or invalid")

    event = CharacterUpdateEvent(data={"action": "created", "character_id": character.id})
    await update_manager.broadcast(event)
    return character

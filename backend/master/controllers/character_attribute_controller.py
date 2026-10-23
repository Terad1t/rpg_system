from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..models.character_attribute_model import CharacterAttribute
from ..models.character_model import Character
from ..schemas.character_attribute_schema import DistributePointRequest, DistributePointResponse
from ..services.character_attribute_service import distribute_points, serialize_attributes
from ..utils.auth_dependencies import CurrentUser, get_current_player, get_current_user

router = APIRouter(prefix="/characters", tags=["characters"])


def _attributes_response(db: Session, character: Character) -> dict:
    attrs = db.query(CharacterAttribute).filter(CharacterAttribute.character_id == character.id).all()
    return {"free_points": character.free_points or 0, "attributes": serialize_attributes(attrs)}


@router.post("/{character_id}/distribute-points", response_model=DistributePointResponse)
def post_distribute_points(
    character_id: int,
    payload: DistributePointRequest,
    db: Session = Depends(get_db),
    player: CurrentUser = Depends(get_current_player),
):
    character = db.get(Character, character_id)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    if character.user_id != player.user_id:
        raise HTTPException(status_code=403, detail="You are not the owner of this character")

    try:
        distribute_points(db, character_id, player.user_id, payload.attribute_name, payload.points_to_add)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    db.refresh(character)
    return _attributes_response(db, character)


@router.get("/{character_id}/attributes", response_model=DistributePointResponse)
def get_attributes(character_id: int, db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    """Dono do personagem ou Master."""
    character = db.get(Character, character_id)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    if not user.is_master and character.user_id != user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return _attributes_response(db, character)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..schemas.character_attribute_schema import DistributePointRequest, CharacterAttributeRead
from ..services.character_attribute_service import distribute_points
from ..models.character_model import Character
from ..models.character_attribute_model import CharacterAttribute
from ..utils.auth_dependencies import get_current_player, CurrentUser

router = APIRouter(prefix="/characters", tags=["characters"])


@router.post("/{character_id}/distribute-points")
def post_distribute_points(character_id: int, payload: DistributePointRequest, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_player)):
    # verify ownership
    char = db.query(Character).filter(Character.id == character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")
    if str(char.user_id) != str(current_user.user_id):
        raise HTTPException(status_code=403, detail="You are not the owner of this character")

    try:
        attr = distribute_points(db, character_id, int(current_user.user_id), payload.attribute_name, payload.points_to_add)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # return updated free_points and attributes
    db.refresh(char)
    attrs = db.query(CharacterAttribute).filter(CharacterAttribute.character_id == character_id).all()
    # convert to dict list
    out = []
    for a in attrs:
        total = int((a.base_value + a.distributed_points + (a.equipment_bonus or 0)) * (a.buff_multiplier or 1.0))
        out.append({
            "attribute_name": a.attribute_name,
            "base_value": a.base_value,
            "distributed_points": a.distributed_points,
            "equipment_bonus": a.equipment_bonus,
            "buff_multiplier": a.buff_multiplier,
            "total_value": total,
        })

    return {"free_points": char.free_points, "attributes": out}


@router.get("/{character_id}/attributes")
def get_attributes(character_id: int, db: Session = Depends(get_db), current_user: CurrentUser = Depends(get_current_player)):
    char = db.query(Character).filter(Character.id == character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")
    # allow owner or master
    if char.user_id and str(char.user_id) != str(current_user.user_id) and current_user.role != 'master':
        raise HTTPException(status_code=403, detail="Forbidden")

    attrs = db.query(CharacterAttribute).filter(CharacterAttribute.character_id == character_id).all()
    out = []
    for a in attrs:
        total = int((a.base_value + a.distributed_points + (a.equipment_bonus or 0)) * (a.buff_multiplier or 1.0))
        out.append({
            "attribute_name": a.attribute_name,
            "base_value": a.base_value,
            "distributed_points": a.distributed_points,
            "equipment_bonus": a.equipment_bonus,
            "buff_multiplier": a.buff_multiplier,
            "total_value": total,
        })
    return {"free_points": char.free_points, "attributes": out}

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from ..database.connection import get_db
from ..models.buff_debuff_model import BuffDebuff
from ..models.user_model import User
from ..utils.auth_dependencies import get_current_master, CurrentUser

router = APIRouter(prefix="/master/buffs", tags=["master-buffs"])


@router.get("/")
def list_buffs(db: Session = Depends(get_db), current_master: CurrentUser = Depends(get_current_master)):
    items = db.query(BuffDebuff).order_by(BuffDebuff.id.asc()).all()
    result = []
    for it in items:
        result.append({
            "id": it.id,
            "name": it.name,
            "kind": it.kind,
            "description": it.description,
            "effects": json.loads(it.effects) if it.effects else None,
            "duration_default_seconds": it.duration_default_seconds,
            "multipliers": json.loads(it.multipliers) if it.multipliers else None,
            "attributes_affected": json.loads(it.attributes_affected) if it.attributes_affected else None,
            "stackable": bool(it.stackable),
            "created_at": it.created_at.isoformat() if it.created_at else None,
            "created_by": it.created_by,
        })
    return result


@router.post("/")
def create_buff(payload: dict, db: Session = Depends(get_db), current_master: CurrentUser = Depends(get_current_master)):
    if not payload.get("name"):
        raise HTTPException(status_code=400, detail="Name is required")
    name = str(payload.get("name")).strip()
    kind = payload.get("kind") or "buff"
    existing = db.query(BuffDebuff).filter(BuffDebuff.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Buff/Debuff with this name already exists")

    item = BuffDebuff(
        name=name,
        kind=kind,
        description=payload.get("description"),
        effects=json.dumps(payload.get("effects")) if payload.get("effects") is not None else None,
        duration_default_seconds=payload.get("duration_default_seconds"),
        multipliers=json.dumps(payload.get("multipliers")) if payload.get("multipliers") is not None else None,
        attributes_affected=json.dumps(payload.get("attributes_affected")) if payload.get("attributes_affected") is not None else None,
        stackable=bool(payload.get("stackable")),
        created_by=getattr(current_master, "user_id", None),
    )
    try:
        db.add(item)
        db.commit()
        db.refresh(item)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"ok": True, "id": item.id}


@router.get("/{item_id}")
def read_buff(item_id: int, db: Session = Depends(get_db), current_master: CurrentUser = Depends(get_current_master)):
    it = db.query(BuffDebuff).filter(BuffDebuff.id == item_id).first()
    if not it:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "id": it.id,
        "name": it.name,
        "kind": it.kind,
        "description": it.description,
        "effects": json.loads(it.effects) if it.effects else None,
        "duration_default_seconds": it.duration_default_seconds,
        "multipliers": json.loads(it.multipliers) if it.multipliers else None,
        "attributes_affected": json.loads(it.attributes_affected) if it.attributes_affected else None,
        "stackable": bool(it.stackable),
        "created_at": it.created_at.isoformat() if it.created_at else None,
        "created_by": it.created_by,
    }


@router.put("/{item_id}")
def update_buff(item_id: int, payload: dict, db: Session = Depends(get_db), current_master: CurrentUser = Depends(get_current_master)):
    it = db.query(BuffDebuff).filter(BuffDebuff.id == item_id).first()
    if not it:
        raise HTTPException(status_code=404, detail="Not found")

    if payload.get("name"):
        it.name = str(payload.get("name")).strip()
    if payload.get("kind"):
        it.kind = payload.get("kind")
    if "description" in payload:
        it.description = payload.get("description")
    if "effects" in payload:
        it.effects = json.dumps(payload.get("effects")) if payload.get("effects") is not None else None
    if "duration_default_seconds" in payload:
        it.duration_default_seconds = payload.get("duration_default_seconds")
    if "multipliers" in payload:
        it.multipliers = json.dumps(payload.get("multipliers")) if payload.get("multipliers") is not None else None
    if "attributes_affected" in payload:
        it.attributes_affected = json.dumps(payload.get("attributes_affected")) if payload.get("attributes_affected") is not None else None
    if "stackable" in payload:
        it.stackable = bool(payload.get("stackable"))

    try:
        db.add(it)
        db.commit()
        db.refresh(it)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"ok": True}


@router.delete("/{item_id}")
def delete_buff(item_id: int, db: Session = Depends(get_db), current_master: CurrentUser = Depends(get_current_master)):
    it = db.query(BuffDebuff).filter(BuffDebuff.id == item_id).first()
    if not it:
        raise HTTPException(status_code=404, detail="Not found")
    try:
        db.delete(it)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return {"ok": True}

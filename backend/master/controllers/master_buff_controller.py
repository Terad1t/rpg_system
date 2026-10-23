import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..models.buff_debuff_model import BuffDebuff
from ..schemas.buff_schema import JSON_FIELDS, BuffCreate, BuffRead, BuffUpdate
from ..utils.auth_dependencies import CurrentUser, get_current_master

router = APIRouter(prefix="/master/buffs", tags=["master-buffs"], dependencies=[Depends(get_current_master)])


def _to_columns(data: dict) -> dict:
    """Converte os campos estruturados para o texto JSON guardado no banco."""
    return {key: (json.dumps(value) if key in JSON_FIELDS and value is not None else value) for key, value in data.items()}


def _get_or_404(db: Session, buff_id: int) -> BuffDebuff:
    buff = db.get(BuffDebuff, buff_id)
    if not buff:
        raise HTTPException(status_code=404, detail="Not found")
    return buff


def _ensure_unique_name(db: Session, name: str, exclude_id: int | None = None) -> None:
    query = db.query(BuffDebuff).filter(BuffDebuff.name == name)
    if exclude_id is not None:
        query = query.filter(BuffDebuff.id != exclude_id)
    if query.first():
        raise HTTPException(status_code=400, detail="Buff/Debuff with this name already exists")


@router.get("/", response_model=list[BuffRead])
def list_buffs(db: Session = Depends(get_db)):
    return db.query(BuffDebuff).order_by(BuffDebuff.id.asc()).all()


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_buff(payload: BuffCreate, db: Session = Depends(get_db), master: CurrentUser = Depends(get_current_master)):
    _ensure_unique_name(db, payload.name)
    buff = BuffDebuff(**_to_columns(payload.model_dump()), created_by=master.user_id)
    db.add(buff)
    db.commit()
    return {"ok": True, "id": buff.id}


@router.get("/{buff_id}", response_model=BuffRead)
def read_buff(buff_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, buff_id)


@router.put("/{buff_id}")
def update_buff(buff_id: int, payload: BuffUpdate, db: Session = Depends(get_db)):
    buff = _get_or_404(db, buff_id)
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("name"):
        changes["name"] = changes["name"].strip()
        _ensure_unique_name(db, changes["name"], exclude_id=buff_id)
    for key, value in _to_columns(changes).items():
        setattr(buff, key, value)
    db.commit()
    return {"ok": True}


@router.delete("/{buff_id}")
def delete_buff(buff_id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, buff_id))
    db.commit()
    return {"ok": True}

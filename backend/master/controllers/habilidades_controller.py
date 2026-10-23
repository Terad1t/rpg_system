from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..schemas.habilidades_schema import HabilidadeCreate, HabilidadeRead, HabilidadeUpdate
from ..schemas.update_schema import SkillUpdateEvent
from ..services.habilidades_services import (
    create_habilidade,
    delete_habilidade,
    get_habilidade_by_id,
    get_habilidades,
    update_habilidade,
)
from ..utils.auth_dependencies import CurrentUser, get_current_master, get_current_user
from ..utils.broadcast import broadcast_manager

router = APIRouter(prefix="/habilidades", tags=["habilidades"], dependencies=[Depends(get_current_user)])


def _as_json(habilidade) -> dict:
    return HabilidadeRead.model_validate(habilidade).model_dump(mode="json")


@router.get("/", response_model=list[HabilidadeRead])
def read_habilidades(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_habilidades(db, skip=skip, limit=limit)


@router.get("/{habilidade_id}", response_model=HabilidadeRead)
def read_habilidade(habilidade_id: int, db: Session = Depends(get_db)):
    db_habilidade = get_habilidade_by_id(db, habilidade_id=habilidade_id)
    if db_habilidade is None:
        raise HTTPException(status_code=404, detail="Habilidade not found")
    return db_habilidade


@router.post("/", response_model=HabilidadeRead, status_code=status.HTTP_201_CREATED)
async def create_new_habilidade(
    habilidade: HabilidadeCreate,
    db: Session = Depends(get_db),
    _master: CurrentUser = Depends(get_current_master),
):
    db_habilidade = create_habilidade(db=db, habilidade=habilidade)
    await broadcast_manager.broadcast(SkillUpdateEvent(data={"action": "created", "habilidade": _as_json(db_habilidade)}))
    return db_habilidade


@router.put("/{habilidade_id}", response_model=HabilidadeRead)
async def update_existing_habilidade(
    habilidade_id: int,
    habilidade: HabilidadeUpdate,
    db: Session = Depends(get_db),
    _master: CurrentUser = Depends(get_current_master),
):
    db_habilidade = update_habilidade(db, habilidade_id=habilidade_id, habilidade_update=habilidade)
    if db_habilidade is None:
        raise HTTPException(status_code=404, detail="Habilidade not found")
    await broadcast_manager.broadcast(
        SkillUpdateEvent(data={"action": "updated", "habilidade_id": habilidade_id, "habilidade": _as_json(db_habilidade)})
    )
    return db_habilidade


@router.delete("/{habilidade_id}")
async def delete_existing_habilidade(
    habilidade_id: int,
    db: Session = Depends(get_db),
    _master: CurrentUser = Depends(get_current_master),
):
    db_habilidade = delete_habilidade(db, habilidade_id=habilidade_id)
    if db_habilidade is None:
        raise HTTPException(status_code=404, detail="Habilidade not found")
    await broadcast_manager.broadcast(SkillUpdateEvent(data={"action": "deleted", "habilidade_id": habilidade_id}))
    return {"message": "Habilidade deleted successfully"}

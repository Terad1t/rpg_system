from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from schemas.habilidades_schema import HabilidadeCreate, HabilidadeRead, HabilidadeUpdate
from services.habilidades_services import (
    get_habilidades,
    get_habilidade_by_id,
    create_habilidade,
    update_habilidade,
    delete_habilidade,
)

router = APIRouter(prefix="/habilidades", tags=["habilidades"])

@router.get("/", response_model=list[HabilidadeRead])
def read_habilidades(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    habilidades = get_habilidades(db, skip=skip, limit=limit)
    return habilidades

@router.get("/{habilidade_id}", response_model=HabilidadeRead)
def read_habilidade(habilidade_id: int, db: Session = Depends(get_db)):
    db_habilidade = get_habilidade_by_id(db, habilidade_id=habilidade_id)
    if db_habilidade is None:
        raise HTTPException(status_code=404, detail="Habilidade not found")
    return db_habilidade

@router.post("/", response_model=HabilidadeRead)
def create_new_habilidade(habilidade: HabilidadeCreate, db: Session = Depends(get_db)):
    return create_habilidade(db=db, habilidade=habilidade)

@router.put("/{habilidade_id}", response_model=HabilidadeRead)
def update_existing_habilidade(habilidade_id: int, habilidade: HabilidadeUpdate, db: Session = Depends(get_db)):
    db_habilidade = update_habilidade(db, habilidade_id=habilidade_id, habilidade_update=habilidade)
    if db_habilidade is None:
        raise HTTPException(status_code=404, detail="Habilidade not found")
    return db_habilidade

@router.delete("/{habilidade_id}")
def delete_existing_habilidade(habilidade_id: int, db: Session = Depends(get_db)):
    db_habilidade = delete_habilidade(db, habilidade_id=habilidade_id)
    if db_habilidade is None:
        raise HTTPException(status_code=404, detail="Habilidade not found")
    return {"message": "Habilidade deleted successfully"}
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..models.raca_model import Raca
from ..schemas.raca_schema import RacaRead, RacaCreate, RacaUpdate
from ..utils.auth_dependencies import get_current_master
from typing import List

router = APIRouter(prefix="/racas", tags=["racas"])

@router.get("/", response_model=List[RacaRead])
def list_racas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lista todas as raças disponíveis"""
    racas = db.query(Raca).offset(skip).limit(limit).all()
    return racas

@router.get("/{raca_id}", response_model=RacaRead)
def get_raca(raca_id: int, db: Session = Depends(get_db)):
    """Obtém uma raça específica"""
    raca = db.query(Raca).filter(Raca.id == raca_id).first()
    if not raca:
        raise HTTPException(status_code=404, detail="Raça não encontrada")
    return raca

@router.post("/", response_model=RacaRead, status_code=status.HTTP_201_CREATED)
def create_raca(payload: RacaCreate, db: Session = Depends(get_db), current_master = Depends(get_current_master)):
    """Cria uma nova raça (apenas mestre)"""
    raca = Raca(**payload.model_dump())
    db.add(raca)
    db.commit()
    db.refresh(raca)
    return raca

@router.put("/{raca_id}", response_model=RacaRead)
def update_raca(raca_id: int, payload: RacaUpdate, db: Session = Depends(get_db), current_master = Depends(get_current_master)):
    """Atualiza uma raça (apenas mestre)"""
    raca = db.query(Raca).filter(Raca.id == raca_id).first()
    if not raca:
        raise HTTPException(status_code=404, detail="Raça não encontrada")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(raca, key, value)
    db.commit()
    db.refresh(raca)
    return raca

@router.delete("/{raca_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_raca(raca_id: int, db: Session = Depends(get_db), current_master = Depends(get_current_master)):
    """Deleta uma raça (apenas mestre)"""
    raca = db.query(Raca).filter(Raca.id == raca_id).first()
    if not raca:
        raise HTTPException(status_code=404, detail="Raça não encontrada")
    db.delete(raca)
    db.commit()
    return None

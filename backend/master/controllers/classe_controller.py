from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..models.classe_model import Classe
from ..schemas.classe_schema import ClasseRead, ClasseCreate, ClasseUpdate
from ..utils.auth_dependencies import get_current_master
from typing import List

router = APIRouter(prefix="/classes", tags=["classes"])

@router.get("/", response_model=List[ClasseRead])
def list_classes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lista todas as classes disponíveis"""
    classes = db.query(Classe).offset(skip).limit(limit).all()
    return classes

@router.get("/{classe_id}", response_model=ClasseRead)
def get_classe(classe_id: int, db: Session = Depends(get_db)):
    """Obtém uma classe específica"""
    classe = db.query(Classe).filter(Classe.id == classe_id).first()
    if not classe:
        raise HTTPException(status_code=404, detail="Classe não encontrada")
    return classe

@router.post("/", response_model=ClasseRead, status_code=status.HTTP_201_CREATED)
def create_classe(payload: ClasseCreate, db: Session = Depends(get_db), current_master = Depends(get_current_master)):
    """Cria uma nova classe (apenas mestre)"""
    classe = Classe(**payload.model_dump())
    db.add(classe)
    db.commit()
    db.refresh(classe)
    return classe

@router.put("/{classe_id}", response_model=ClasseRead)
def update_classe(classe_id: int, payload: ClasseUpdate, db: Session = Depends(get_db), current_master = Depends(get_current_master)):
    """Atualiza uma classe (apenas mestre)"""
    classe = db.query(Classe).filter(Classe.id == classe_id).first()
    if not classe:
        raise HTTPException(status_code=404, detail="Classe não encontrada")
    
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(classe, key, value)
    db.commit()
    db.refresh(classe)
    return classe

@router.delete("/{classe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_classe(classe_id: int, db: Session = Depends(get_db), current_master = Depends(get_current_master)):
    """Deleta uma classe (apenas mestre)"""
    classe = db.query(Classe).filter(Classe.id == classe_id).first()
    if not classe:
        raise HTTPException(status_code=404, detail="Classe não encontrada")
    db.delete(classe)
    db.commit()
    return None

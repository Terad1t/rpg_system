from sqlalchemy.orm import Session
from ..models.habilidades_model import Habilidade
from ..schemas.habilidades_schema import HabilidadeCreate, HabilidadeUpdate

def get_habilidades(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Habilidade).offset(skip).limit(limit).all()

def get_habilidade_by_id(db: Session, habilidade_id: int):
    return db.query(Habilidade).filter(Habilidade.id == habilidade_id).first()

def create_habilidade(db: Session, habilidade: HabilidadeCreate):
    db_habilidade = Habilidade(**habilidade.model_dump())
    db.add(db_habilidade)
    db.commit()
    db.refresh(db_habilidade)
    return db_habilidade

def update_habilidade(db: Session, habilidade_id: int, habilidade_update: HabilidadeUpdate):
    db_habilidade = db.query(Habilidade).filter(Habilidade.id == habilidade_id).first()
    if db_habilidade:
        for key, value in habilidade_update.model_dump(exclude_unset=True).items():
            setattr(db_habilidade, key, value)
        db.commit()
        db.refresh(db_habilidade)
    return db_habilidade

def delete_habilidade(db: Session, habilidade_id: int):
    db_habilidade = db.query(Habilidade).filter(Habilidade.id == habilidade_id).first()
    if db_habilidade:
        db.delete(db_habilidade)
        db.commit()
    return db_habilidade
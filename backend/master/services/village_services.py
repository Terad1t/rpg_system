from sqlalchemy.orm import Session
from models.village_model import Village
from schemas.village_schema import VillageCreate, VillageUpdate

def get_villages(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Village).offset(skip).limit(limit).all()

def get_village_by_id(db: Session, village_id: int):
    return db.query(Village).filter(Village.id == village_id).first()

def get_villages_by_country(db: Session, country_id: int):
    return db.query(Village).filter(Village.country_id == country_id).all()

def create_village(db: Session, village: VillageCreate):
    db_village = Village(**village.model_dump())
    db.add(db_village)
    db.commit()
    db.refresh(db_village)
    return db_village

def update_village(db: Session, village_id: int, village_update: VillageUpdate):
    db_village = db.query(Village).filter(Village.id == village_id).first()
    if db_village:
        for key, value in village_update.model_dump(exclude_unset=True).items():
            setattr(db_village, key, value)
        db.commit()
        db.refresh(db_village)
    return db_village

def delete_village(db: Session, village_id: int):
    db_village = db.query(Village).filter(Village.id == village_id).first()
    if db_village:
        db.delete(db_village)
        db.commit()
    return db_village
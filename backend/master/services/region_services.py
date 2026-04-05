from sqlalchemy.orm import Session
from ..models.region_model import Region
from ..schemas.region_schema import RegionCreate, RegionUpdate

def get_regions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Region).offset(skip).limit(limit).all()

def get_region_by_id(db: Session, region_id: int):
    return db.query(Region).filter(Region.id == region_id).first()

def create_region(db: Session, region: RegionCreate):
    db_region = Region(**region.model_dump())
    db.add(db_region)
    db.commit()
    db.refresh(db_region)
    return db_region

def update_region(db: Session, region_id: int, region_update: RegionUpdate):
    db_region = db.query(Region).filter(Region.id == region_id).first()
    if db_region:
        for key, value in region_update.model_dump(exclude_unset=True).items():
            setattr(db_region, key, value)
        db.commit()
        db.refresh(db_region)
    return db_region

def delete_region(db: Session, region_id: int):
    db_region = db.query(Region).filter(Region.id == region_id).first()
    if db_region:
        db.delete(db_region)
        db.commit()
    return db_region
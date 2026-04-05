from sqlalchemy.orm import Session
from models.country_model import Country
from schemas.country_schema import CountryCreate, CountryUpdate

def get_countries(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Country).offset(skip).limit(limit).all()

def get_country_by_id(db: Session, country_id: int):
    return db.query(Country).filter(Country.id == country_id).first()

def get_countries_by_region(db: Session, region_id: int):
    return db.query(Country).filter(Country.region_id == region_id).all()

def create_country(db: Session, country: CountryCreate):
    db_country = Country(**country.model_dump())
    db.add(db_country)
    db.commit()
    db.refresh(db_country)
    return db_country

def update_country(db: Session, country_id: int, country_update: CountryUpdate):
    db_country = db.query(Country).filter(Country.id == country_id).first()
    if db_country:
        for key, value in country_update.model_dump(exclude_unset=True).items():
            setattr(db_country, key, value)
        db.commit()
        db.refresh(db_country)
    return db_country

def delete_country(db: Session, country_id: int):
    db_country = db.query(Country).filter(Country.id == country_id).first()
    if db_country:
        db.delete(db_country)
        db.commit()
    return db_country
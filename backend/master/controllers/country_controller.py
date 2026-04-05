from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from schemas.country_schema import CountryCreate, CountryRead, CountryUpdate
from services.country_services import (
    get_countries,
    get_country_by_id,
    get_countries_by_region,
    create_country,
    update_country,
    delete_country,
)

router = APIRouter(prefix="/countries", tags=["map"])

@router.get("/", response_model=list[CountryRead])
def read_countries(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    countries = get_countries(db, skip=skip, limit=limit)
    return countries

@router.get("/region/{region_id}", response_model=list[CountryRead])
def read_countries_by_region(region_id: int, db: Session = Depends(get_db)):
    countries = get_countries_by_region(db, region_id=region_id)
    if not countries:
        raise HTTPException(status_code=404, detail="No countries found in this region")
    return countries

@router.get("/{country_id}", response_model=CountryRead)
def read_country(country_id: int, db: Session = Depends(get_db)):
    db_country = get_country_by_id(db, country_id=country_id)
    if db_country is None:
        raise HTTPException(status_code=404, detail="Country not found")
    return db_country

@router.post("/", response_model=CountryRead)
def create_new_country(country: CountryCreate, db: Session = Depends(get_db)):
    return create_country(db=db, country=country)

@router.put("/{country_id}", response_model=CountryRead)
def update_existing_country(country_id: int, country: CountryUpdate, db: Session = Depends(get_db)):
    db_country = update_country(db, country_id=country_id, country_update=country)
    if db_country is None:
        raise HTTPException(status_code=404, detail="Country not found")
    return db_country

@router.delete("/{country_id}")
def delete_existing_country(country_id: int, db: Session = Depends(get_db)):
    db_country = delete_country(db, country_id=country_id)
    if db_country is None:
        raise HTTPException(status_code=404, detail="Country not found")
    return {"message": "Country deleted successfully"}
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from schemas.village_schema import VillageCreate, VillageRead, VillageUpdate
from services.village_services import (
    get_villages,
    get_village_by_id,
    get_villages_by_country,
    create_village,
    update_village,
    delete_village,
)

router = APIRouter(prefix="/villages", tags=["map"])

@router.get("/", response_model=list[VillageRead])
def read_villages(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    villages = get_villages(db, skip=skip, limit=limit)
    return villages

@router.get("/country/{country_id}", response_model=list[VillageRead])
def read_villages_by_country(country_id: int, db: Session = Depends(get_db)):
    villages = get_villages_by_country(db, country_id=country_id)
    if not villages:
        raise HTTPException(status_code=404, detail="No villages found in this country")
    return villages

@router.get("/{village_id}", response_model=VillageRead)
def read_village(village_id: int, db: Session = Depends(get_db)):
    db_village = get_village_by_id(db, village_id=village_id)
    if db_village is None:
        raise HTTPException(status_code=404, detail="Village not found")
    return db_village

@router.post("/", response_model=VillageRead)
def create_new_village(village: VillageCreate, db: Session = Depends(get_db)):
    return create_village(db=db, village=village)

@router.put("/{village_id}", response_model=VillageRead)
def update_existing_village(village_id: int, village: VillageUpdate, db: Session = Depends(get_db)):
    db_village = update_village(db, village_id=village_id, village_update=village)
    if db_village is None:
        raise HTTPException(status_code=404, detail="Village not found")
    return db_village

@router.delete("/{village_id}")
def delete_existing_village(village_id: int, db: Session = Depends(get_db)):
    db_village = delete_village(db, village_id=village_id)
    if db_village is None:
        raise HTTPException(status_code=404, detail="Village not found")
    return {"message": "Village deleted successfully"}
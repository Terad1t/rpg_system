from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..schemas.village_schema import VillageCreate, VillageRead, VillageUpdate
from ..services.village_services import (
    create_village,
    delete_village,
    get_village_by_id,
    get_villages,
    get_villages_by_country,
    update_village,
)
from ..utils.auth_dependencies import CurrentUser, get_current_master, get_current_user

router = APIRouter(prefix="/villages", tags=["map"], dependencies=[Depends(get_current_user)])


@router.get("/", response_model=list[VillageRead])
def read_villages(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    villages = get_villages(db, skip=skip, limit=limit)
    return villages


@router.get("/country/{country_id}", response_model=list[VillageRead])
def read_villages_by_country(country_id: int, db: Session = Depends(get_db)):
    villages = get_villages_by_country(db, country_id=country_id)
    return villages


@router.get("/{village_id}", response_model=VillageRead)
def read_village(village_id: int, db: Session = Depends(get_db)):
    db_village = get_village_by_id(db, village_id=village_id)
    if db_village is None:
        raise HTTPException(status_code=404, detail="Village not found")
    return db_village


@router.post("/", status_code=201, response_model=VillageRead)
def create_new_village(village: VillageCreate, db: Session = Depends(get_db), _master: CurrentUser = Depends(get_current_master)):
    return create_village(db=db, village=village)


@router.put("/{village_id}", response_model=VillageRead)
def update_existing_village(
    village_id: int, village: VillageUpdate, db: Session = Depends(get_db), _master: CurrentUser = Depends(get_current_master)
):
    db_village = update_village(db, village_id=village_id, village_update=village)
    if db_village is None:
        raise HTTPException(status_code=404, detail="Village not found")
    return db_village


@router.delete("/{village_id}")
def delete_existing_village(village_id: int, db: Session = Depends(get_db), _master: CurrentUser = Depends(get_current_master)):
    db_village = delete_village(db, village_id=village_id)
    if db_village is None:
        raise HTTPException(status_code=404, detail="Village not found")
    return {"message": "Village deleted successfully"}

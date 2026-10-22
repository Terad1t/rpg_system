from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..schemas.region_schema import RegionCreate, RegionRead, RegionUpdate
from ..services.region_services import (
    create_region,
    delete_region,
    get_region_by_id,
    get_regions,
    update_region,
)
from ..utils.auth_dependencies import CurrentUser, get_current_master, get_current_user

router = APIRouter(prefix="/regions", tags=["map"], dependencies=[Depends(get_current_user)])


@router.get("/", response_model=list[RegionRead])
def read_regions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    regions = get_regions(db, skip=skip, limit=limit)
    return regions


@router.get("/{region_id}", response_model=RegionRead)
def read_region(region_id: int, db: Session = Depends(get_db)):
    db_region = get_region_by_id(db, region_id=region_id)
    if db_region is None:
        raise HTTPException(status_code=404, detail="Region not found")
    return db_region


@router.post("/", status_code=201, response_model=RegionRead)
def create_new_region(region: RegionCreate, db: Session = Depends(get_db), _master: CurrentUser = Depends(get_current_master)):
    return create_region(db=db, region=region)


@router.put("/{region_id}", response_model=RegionRead)
def update_existing_region(
    region_id: int, region: RegionUpdate, db: Session = Depends(get_db), _master: CurrentUser = Depends(get_current_master)
):
    db_region = update_region(db, region_id=region_id, region_update=region)
    if db_region is None:
        raise HTTPException(status_code=404, detail="Region not found")
    return db_region


@router.delete("/{region_id}")
def delete_existing_region(region_id: int, db: Session = Depends(get_db), _master: CurrentUser = Depends(get_current_master)):
    db_region = delete_region(db, region_id=region_id)
    if db_region is None:
        raise HTTPException(status_code=404, detail="Region not found")
    return {"message": "Region deleted successfully"}

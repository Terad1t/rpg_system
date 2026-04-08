from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..schemas.map_schema import MapCreate, MapRead, MapUpdate
from ..services.map_services import (
    get_maps,
    get_map_by_id,
    create_map,
    update_map,
    delete_map,
)
from ..schemas.update_schema import ItemUpdateEvent
from ..utils.update_manager import update_manager

router = APIRouter(prefix="/maps", tags=["maps"])


@router.get("/", response_model=list[MapRead])
def read_maps(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_maps(db, skip=skip, limit=limit)


@router.get("/{map_id}", response_model=MapRead)
def read_map(map_id: int, db: Session = Depends(get_db)):
    db_map = get_map_by_id(db, map_id=map_id)
    if db_map is None:
        raise HTTPException(status_code=404, detail="Map not found")
    return db_map


@router.post("/", response_model=MapRead)
async def create_new_map(map_in: MapCreate, db: Session = Depends(get_db)):
    db_map = create_map(db=db, map_in=map_in)
    # broadcast
    event = ItemUpdateEvent(data={"action": "created", "map": db_map.__dict__})
    await update_manager.broadcast(event)
    return db_map


@router.put("/{map_id}", response_model=MapRead)
async def update_existing_map(map_id: int, map_update: MapUpdate, db: Session = Depends(get_db)):
    db_map = update_map(db, map_id=map_id, map_update=map_update)
    if db_map is None:
        raise HTTPException(status_code=404, detail="Map not found")
    event = ItemUpdateEvent(data={"action": "updated", "map_id": map_id})
    await update_manager.broadcast(event)
    return db_map


@router.delete("/{map_id}")
async def delete_existing_map(map_id: int, db: Session = Depends(get_db)):
    db_map = delete_map(db, map_id=map_id)
    if db_map is None:
        raise HTTPException(status_code=404, detail="Map not found")
    event = ItemUpdateEvent(data={"action": "deleted", "map_id": map_id})
    await update_manager.broadcast(event)
    return {"message": "Map deleted successfully"}

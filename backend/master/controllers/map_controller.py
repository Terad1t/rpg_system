from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..schemas.map_schema import MapCreate, MapRead, MapUpdate
from ..schemas.update_schema import MapUpdateEvent
from ..services.map_services import build_map_tree, create_map, delete_map, get_map_by_id, get_maps, update_map
from ..utils.auth_dependencies import CurrentUser, get_current_master, get_current_user
from ..utils.broadcast import broadcast_manager

router = APIRouter(prefix="/maps", tags=["maps"], dependencies=[Depends(get_current_user)])


@router.get("/", response_model=list[MapRead])
def read_maps(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_maps(db, skip=skip, limit=limit)


@router.get("/hierarchy")
def read_map_hierarchy(db: Session = Depends(get_db)):
    return {"regions": build_map_tree(db)}


@router.get("/{map_id}", response_model=MapRead)
def read_map(map_id: int, db: Session = Depends(get_db)):
    db_map = get_map_by_id(db, map_id=map_id)
    if db_map is None:
        raise HTTPException(status_code=404, detail="Map not found")
    return db_map


@router.post("/", response_model=MapRead, status_code=status.HTTP_201_CREATED)
async def create_new_map(map_in: MapCreate, db: Session = Depends(get_db), _master: CurrentUser = Depends(get_current_master)):
    db_map = create_map(db=db, map_in=map_in)
    data = MapRead.model_validate(db_map).model_dump(mode="json")
    await broadcast_manager.broadcast(MapUpdateEvent(data={"action": "created", "map": data}))
    return db_map


@router.put("/{map_id}", response_model=MapRead)
async def update_existing_map(
    map_id: int,
    map_update: MapUpdate,
    db: Session = Depends(get_db),
    _master: CurrentUser = Depends(get_current_master),
):
    db_map = update_map(db, map_id=map_id, map_update=map_update)
    if db_map is None:
        raise HTTPException(status_code=404, detail="Map not found")
    await broadcast_manager.broadcast(MapUpdateEvent(data={"action": "updated", "map_id": map_id}))
    return db_map


@router.delete("/{map_id}")
async def delete_existing_map(map_id: int, db: Session = Depends(get_db), _master: CurrentUser = Depends(get_current_master)):
    db_map = delete_map(db, map_id=map_id)
    if db_map is None:
        raise HTTPException(status_code=404, detail="Map not found")
    await broadcast_manager.broadcast(MapUpdateEvent(data={"action": "deleted", "map_id": map_id}))
    return {"message": "Map deleted successfully"}

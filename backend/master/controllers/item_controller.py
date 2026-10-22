from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..schemas.item_schema import ItemCreate, ItemRead, ItemUpdate
from ..services.item_services import create_item, delete_item, get_item_by_id, get_items, update_item
from ..utils.auth_dependencies import get_current_master, get_current_user

router = APIRouter(prefix="/items", tags=["items"], dependencies=[Depends(get_current_user)])


@router.get("/", response_model=list[ItemRead])
def list_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_items(db, skip=skip, limit=limit)


@router.get("/{item_id}", response_model=ItemRead)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = get_item_by_id(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post("/", response_model=ItemRead, status_code=status.HTTP_201_CREATED)
def create_new_item(payload: ItemCreate, db: Session = Depends(get_db), current_master=Depends(get_current_master)):
    return create_item(db, payload)


@router.put("/{item_id}", response_model=ItemRead)
def update_existing_item(
    item_id: int, payload: ItemUpdate, db: Session = Depends(get_db), current_master=Depends(get_current_master)
):
    item = update_item(db, item_id, payload)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.delete("/{item_id}", response_model=ItemRead)
def delete_existing_item(item_id: int, db: Session = Depends(get_db), current_master=Depends(get_current_master)):
    item = delete_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

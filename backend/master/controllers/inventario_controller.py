from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..services.inventory_services import (
    get_inventory_for_character,
    add_item_to_inventory,
    remove_item_from_inventory,
    set_item_quantity,
)
from ..utils.auth_dependencies import get_current_master, get_current_user
from ..utils.inventory_manager import inventory_manager
from ..models.character_model import Character
from ..models.item_model import Item

router = APIRouter(prefix="/characters/{character_id}/inventory", tags=["inventory"])


@router.get("/")
def read_inventory(character_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    # allow master or owner of character
    char = db.query(Character).filter(Character.id == character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")

    if current_user.role != "master" and int(current_user.user_id) != int(char.user_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    return get_inventory_for_character(db, character_id=character_id)


@router.post("/add")
async def post_add_item(character_id: int, item_id: int, quantity: int = 1, current_master = Depends(get_current_master), db: Session = Depends(get_db)):
    master_id = int(current_master.user_id)
    if character_id <= 0 or item_id <= 0:
        raise HTTPException(status_code=400, detail="character_id and item_id must be positive")
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="quantity must be > 0")
    # ensure character and item exist
    char = db.query(Character).filter(Character.id == character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    inv = add_item_to_inventory(db, character_id=character_id, item_id=item_id, quantity=quantity, performed_by=master_id)
    
    # Emite evento em tempo real
    await inventory_manager.broadcast_inventory_update(
        character_id=character_id,
        action="added",
        item_id=item_id,
        item_name=item.name,
        quantity=quantity,
        performed_by=master_id
    )
    
    return inv


@router.post("/remove")
async def post_remove_item(character_id: int, item_id: int, quantity: int = 1, current_master = Depends(get_current_master), db: Session = Depends(get_db)):
    master_id = int(current_master.user_id)
    if character_id <= 0 or item_id <= 0:
        raise HTTPException(status_code=400, detail="character_id and item_id must be positive")
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="quantity must be > 0")
    char = db.query(Character).filter(Character.id == character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    ok = remove_item_from_inventory(db, character_id=character_id, item_id=item_id, quantity=quantity, performed_by=master_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Item not found in inventory")
    
    # Emite evento em tempo real
    await inventory_manager.broadcast_inventory_update(
        character_id=character_id,
        action="removed",
        item_id=item_id,
        item_name=item.name,
        quantity=quantity,
        performed_by=master_id
    )
    
    return {"message": "removed"}


@router.put("/{item_id}")
def put_set_quantity(character_id: int, item_id: int, quantity: int, current_master = Depends(get_current_master), db: Session = Depends(get_db)):
    master_id = int(current_master.user_id)
    if character_id <= 0 or item_id <= 0:
        raise HTTPException(status_code=400, detail="character_id and item_id must be positive")
    if quantity < 0:
        raise HTTPException(status_code=400, detail="quantity must be >= 0")
    char = db.query(Character).filter(Character.id == character_id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    inv = set_item_quantity(db, character_id=character_id, item_id=item_id, quantity=quantity, performed_by=master_id)
    return inv

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from ..database.connection import get_db
from ..models.character_model import Character
from ..models.inventario_model import Inventario
from ..models.item_model import Item
from ..schemas.item_schema import InventoryEntryRead
from ..services.inventory_services import add_item_to_inventory, remove_item_from_inventory, set_item_quantity
from ..utils.auth_dependencies import CurrentUser, get_current_master, get_current_user
from ..utils.inventory_manager import inventory_manager

router = APIRouter(prefix="/characters/{character_id}/inventory", tags=["inventory"])


def _get_character_or_404(db: Session, character_id: int) -> Character:
    character = db.get(Character, character_id)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    return character


def _get_item_or_404(db: Session, item_id: int) -> Item:
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.get("/", response_model=list[InventoryEntryRead])
def read_inventory(character_id: int, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """Dono do personagem ou Master."""
    character = _get_character_or_404(db, character_id)
    if not user.is_master and character.user_id != user.user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return db.query(Inventario).options(joinedload(Inventario.item)).filter(Inventario.character_id == character_id).all()


@router.post("/add", response_model=InventoryEntryRead)
async def post_add_item(
    character_id: int,
    item_id: int = Query(..., ge=1),
    quantity: int = Query(1, ge=1, le=10_000),
    master: CurrentUser = Depends(get_current_master),
    db: Session = Depends(get_db),
):
    _get_character_or_404(db, character_id)
    item = _get_item_or_404(db, item_id)
    entry = add_item_to_inventory(db, character_id=character_id, item_id=item_id, quantity=quantity, performed_by=master.user_id)
    await inventory_manager.broadcast_inventory_update(character_id, "added", item_id, item.name, quantity, master.user_id)
    return entry


@router.post("/remove")
async def post_remove_item(
    character_id: int,
    item_id: int = Query(..., ge=1),
    quantity: int = Query(1, ge=1, le=10_000),
    master: CurrentUser = Depends(get_current_master),
    db: Session = Depends(get_db),
):
    _get_character_or_404(db, character_id)
    item = _get_item_or_404(db, item_id)
    if not remove_item_from_inventory(
        db, character_id=character_id, item_id=item_id, quantity=quantity, performed_by=master.user_id
    ):
        raise HTTPException(status_code=404, detail="Item not found in inventory")
    await inventory_manager.broadcast_inventory_update(character_id, "removed", item_id, item.name, quantity, master.user_id)
    return {"message": "removed"}


@router.put("/{item_id}", response_model=InventoryEntryRead)
async def put_set_quantity(
    character_id: int,
    item_id: int,
    quantity: int = Query(..., ge=0, le=10_000),
    master: CurrentUser = Depends(get_current_master),
    db: Session = Depends(get_db),
):
    _get_character_or_404(db, character_id)
    item = _get_item_or_404(db, item_id)
    entry = set_item_quantity(db, character_id=character_id, item_id=item_id, quantity=quantity, performed_by=master.user_id)
    await inventory_manager.broadcast_inventory_update(character_id, "updated", item_id, item.name, quantity, master.user_id)
    return entry

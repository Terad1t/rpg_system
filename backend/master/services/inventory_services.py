from sqlalchemy.orm import Session
from ..models.inventario_model import Inventario
from ..models.inventory_log_model import InventoryLog


def get_inventory_for_character(db: Session, character_id: int):
    return db.query(Inventario).filter(Inventario.character_id == character_id).all()


def add_item_to_inventory(db: Session, character_id: int, item_id: int, quantity: int, performed_by: int):
    if quantity <= 0:
        raise ValueError("quantity must be > 0")
    # Upsert inventario
    inv = db.query(Inventario).filter(
        Inventario.character_id == character_id,
        Inventario.item_id == item_id,
    ).first()

    if inv:
        inv.quantidade += quantity
    else:
        inv = Inventario(character_id=character_id, item_id=item_id, quantidade=quantity)
        db.add(inv)

    # Create log
    log = InventoryLog(character_id=character_id, item_id=item_id, action="add", quantity=quantity, performed_by=performed_by)
    db.add(log)

    db.commit()
    db.refresh(inv)
    return inv


def remove_item_from_inventory(db: Session, character_id: int, item_id: int, quantity: int, performed_by: int):
    inv = db.query(Inventario).filter(
        Inventario.character_id == character_id,
        Inventario.item_id == item_id,
    ).first()

    if not inv:
        return None

    if quantity <= 0:
        raise ValueError("quantity must be > 0")

    # Decrease quantity; if becomes <=0, delete row
    if inv.quantidade > quantity:
        inv.quantidade -= quantity
        action = "remove"
    else:
        quantity = inv.quantidade
        db.delete(inv)
        action = "remove"

    # Log
    log = InventoryLog(character_id=character_id, item_id=item_id, action=action, quantity=quantity, performed_by=performed_by)
    db.add(log)

    db.commit()
    return True


def set_item_quantity(db: Session, character_id: int, item_id: int, quantity: int, performed_by: int):
    if quantity < 0:
        raise ValueError("quantity must be >= 0")
    inv = db.query(Inventario).filter(
        Inventario.character_id == character_id,
        Inventario.item_id == item_id,
    ).first()

    if not inv:
        inv = Inventario(character_id=character_id, item_id=item_id, quantidade=quantity)
        db.add(inv)
    else:
        inv.quantidade = quantity

    log = InventoryLog(character_id=character_id, item_id=item_id, action="update", quantity=quantity, performed_by=performed_by)
    db.add(log)

    db.commit()
    if inv:
        db.refresh(inv)
    return inv

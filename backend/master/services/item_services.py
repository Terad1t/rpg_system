from sqlalchemy.orm import Session
from ..models.item_model import Item
from ..schemas.item_schema import ItemCreate, ItemUpdate
from typing import List, Optional

def get_items(db: Session, skip: int = 0, limit: int = 100) -> List[Item]:
    return db.query(Item).offset(skip).limit(limit).all()

def get_item_by_id(db: Session, item_id: int) -> Optional[Item]:
    return db.query(Item).filter(Item.id == item_id).first()

def create_item(db: Session, item: ItemCreate) -> Item:
    quantity = item.quantity if item.quantity is not None else item.quantidade_maxima or 1
    db_item = Item(
        name=item.name,
        tipo=item.tipo,
        image=item.image,
        description=item.description,
        buffs=item.buffs,
        nerfs=item.nerfs,
        quantity=quantity,
        quantidade_maxima=quantity,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_item(db: Session, item_id: int, item_update: ItemUpdate) -> Optional[Item]:
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if db_item:
        data = item_update.model_dump(exclude_unset=True)
        if "quantity" in data and data["quantity"] is not None:
            db_item.quantity = data["quantity"]
            db_item.quantidade_maxima = data["quantity"]
        if "quantidade_maxima" in data and data["quantidade_maxima"] is not None:
            db_item.quantity = data["quantidade_maxima"]
            db_item.quantidade_maxima = data["quantidade_maxima"]
        for key in ("name", "tipo", "image", "description", "buffs", "nerfs"):
            if key in data:
                setattr(db_item, key, data[key])
        db.commit()
        db.refresh(db_item)
    return db_item

def delete_item(db: Session, item_id: int) -> Optional[Item]:
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if db_item:
        db.delete(db_item)
        db.commit()
    return db_item

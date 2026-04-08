from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from ..database.connection import Base
from datetime import datetime


class InventoryLog(Base):
    __tablename__ = "inventory_log"

    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("itens.id"), nullable=False)
    action = Column(String, nullable=False)  # add, remove, update
    quantity = Column(Integer, nullable=False)
    performed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    character = relationship("Character")
    item = relationship("Item")
    performer = relationship("User")

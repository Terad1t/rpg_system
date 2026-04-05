from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..database.connection import Base

class Inventario(Base):
    __tablename__ = "inventario"

    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("itens.id"), nullable=False)
    quantidade = Column(Integer, nullable=False, default=1)

    # Relacionamentos
    character = relationship("Character", back_populates="inventario")
    item = relationship("Item", back_populates="inventario")
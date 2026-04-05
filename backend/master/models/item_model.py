from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database.connection import Base

class Item(Base):
    __tablename__ = "itens"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    tipo = Column(String, nullable=False)
    image = Column(String)  # caminho da imagem
    description = Column(String)

    # Relacionamentos
    inventario = relationship("Inventario", back_populates="item")
    habilidades = relationship("Habilidade", back_populates="item")
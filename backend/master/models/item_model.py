from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from ..database.connection import Base

class Item(Base):
    __tablename__ = "itens"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    tipo = Column(String, nullable=False)
    image = Column(String)  # caminho da imagem
    description = Column(String)
    buffs = Column(Text)
    nerfs = Column(Text)
    quantity = Column(Integer, default=1)
    quantidade_maxima = Column(Integer, default=1)  # Compatibilidade com dados antigos

    # Relacionamentos
    inventario = relationship("Inventario", back_populates="item")
    habilidades = relationship("Habilidade", back_populates="item")
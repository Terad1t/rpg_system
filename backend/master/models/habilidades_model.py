from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..database.connection import Base

class Habilidade(Base):
    __tablename__ = "habilidades"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    tipo = Column(String, nullable=False)  # classe, raça, item
    custo_vigor = Column(Integer, default=0)
    custo_vida = Column(Integer, default=0)
    dano_base = Column(Integer, default=0)
    efeitos_atributos = Column(Text)  # JSON string ou descrição

    # Relacionamentos opcionais
    classe_id = Column(Integer, ForeignKey("classes.id"), nullable=True)
    raca_id = Column(Integer, ForeignKey("racas.id"), nullable=True)
    item_id = Column(Integer, ForeignKey("itens.id"), nullable=True)

    # Relationships
    classe = relationship("Classe", back_populates="habilidades")
    raca = relationship("Raca", back_populates="habilidades")
    item = relationship("Item", back_populates="habilidades")
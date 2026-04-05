from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database.connection import Base

class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    tipo = Column(String, nullable=False)  # player, npc, boss
    raca_id = Column(Integer, ForeignKey("racas.id"))
    classe_id = Column(Integer, ForeignKey("classes.id"))

    # Relacionamentos
    raca = relationship("Raca", back_populates="characters")
    classe = relationship("Classe", back_populates="characters")
    attributes = relationship("Attribute", back_populates="character")
    inventario = relationship("Inventario", back_populates="character")
    batalha_participantes = relationship("BatalhaParticipante", back_populates="character")
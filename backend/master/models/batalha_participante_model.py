from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from database.connection import Base

class BatalhaParticipante(Base):
    __tablename__ = "batalha_participantes"

    id = Column(Integer, primary_key=True, index=True)
    batalha_id = Column(Integer, ForeignKey("batalhas.id"), nullable=False)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)

    # Relacionamentos
    batalha = relationship("Batalha", back_populates="participantes")
    character = relationship("Character", back_populates="batalha_participantes")
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..database.connection import Base

class Batalha(Base):
    __tablename__ = "batalhas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)

    # Relacionamento
    participantes = relationship("BatalhaParticipante", back_populates="batalha")
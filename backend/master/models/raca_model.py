from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database.connection import Base

class Raca(Base):
    __tablename__ = "racas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)

    # Relacionamentos
    characters = relationship("Character", back_populates="raca")
    raca_bonus = relationship("RacaBonus", back_populates="raca")
    habilidades = relationship("Habilidade", back_populates="raca")
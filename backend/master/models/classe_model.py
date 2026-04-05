from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..database.connection import Base

class Classe(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    subclass = Column(String)  # Eden, Nede, etc.
    description = Column(String)

    # Relacionamentos
    characters = relationship("Character", back_populates="classe")
    habilidades = relationship("Habilidade", back_populates="classe")
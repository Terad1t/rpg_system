from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from ..database.connection import Base
from datetime import datetime


class CharacterHabilidade(Base):
    __tablename__ = "character_habilidades"

    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)
    habilidade_id = Column(Integer, ForeignKey("habilidades.id"), nullable=False)
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    character = relationship("Character", back_populates="habilidades_assigned")
    habilidade = relationship("Habilidade")

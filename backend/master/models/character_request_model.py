from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..core.time import utcnow
from ..database.connection import Base


class CharacterRequest(Base):
    __tablename__ = "character_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    codename = Column(String, nullable=True)
    name = Column(String, nullable=False)
    raca_id = Column(Integer, ForeignKey("racas.id"), nullable=False)
    classe_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=True)
    age = Column(Integer, nullable=True)
    height = Column(Float, nullable=True)
    description = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, approved, rejected
    created_at = Column(DateTime, default=utcnow)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    raca = relationship("Raca")
    classe = relationship("Classe")

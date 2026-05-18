from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from ..database.connection import Base
from datetime import datetime


class CharacterAttribute(Base):
    __tablename__ = "character_attributes"

    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)
    attribute_name = Column(String, nullable=False)
    base_value = Column(Integer, nullable=False, default=0)
    distributed_points = Column(Integer, nullable=False, default=0)
    equipment_bonus = Column(Integer, nullable=False, default=0)
    buff_multiplier = Column(Float, nullable=False, default=1.0)
    calculated_at = Column(DateTime, default=datetime.utcnow)

    character = relationship("Character", back_populates="attributes")

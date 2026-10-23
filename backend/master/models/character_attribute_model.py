from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..core.time import utcnow
from ..database.connection import Base


class CharacterAttribute(Base):
    __tablename__ = "character_attributes"

    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)
    attribute_name = Column(String, nullable=False)
    base_value = Column(Integer, nullable=False, default=0)
    distributed_points = Column(Integer, nullable=False, default=0)
    equipment_bonus = Column(Integer, nullable=False, default=0)
    buff_multiplier = Column(Float, nullable=False, default=1.0)
    calculated_at = Column(DateTime, default=utcnow)

    # Match the relationship name used in Character.character_attributes_link
    character = relationship("Character", back_populates="character_attributes_link")

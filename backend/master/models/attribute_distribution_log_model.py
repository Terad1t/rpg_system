from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from ..database.connection import Base
from datetime import datetime


class AttributeDistributionLog(Base):
    __tablename__ = "attribute_distribution_log"

    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    attribute_name = Column(String, nullable=False)
    old_value = Column(Integer)
    new_value = Column(Integer)
    operation = Column(String, nullable=False)  # add, remove, reset
    distributed_at = Column(DateTime, default=datetime.utcnow)

    character = relationship("Character")
    user = relationship("User")

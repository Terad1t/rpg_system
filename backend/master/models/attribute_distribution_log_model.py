from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..core.time import utcnow
from ..database.connection import Base


class AttributeDistributionLog(Base):
    __tablename__ = "attribute_distribution_log"

    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    attribute_name = Column(String, nullable=False)
    old_value = Column(Integer)
    new_value = Column(Integer)
    operation = Column(String, nullable=False)  # add, remove, reset
    distributed_at = Column(DateTime, default=utcnow)

    character = relationship("Character")
    user = relationship("User")

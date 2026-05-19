from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database.connection import Base


class BuffDebuff(Base):
    __tablename__ = "buffs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    kind = Column(String, nullable=False, default="buff")  # 'buff' or 'debuff'
    description = Column(Text, nullable=True)
    effects = Column(Text, nullable=True)  # JSON string describing effects
    duration_default_seconds = Column(Integer, nullable=True)
    multipliers = Column(Text, nullable=True)  # JSON string with multipliers
    attributes_affected = Column(Text, nullable=True)  # JSON string list of attribute keys
    stackable = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    creator = relationship("User")

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..core.time import utcnow
from ..database.connection import Base


class MasterAudit(Base):
    __tablename__ = "master_audit"

    id = Column(Integer, primary_key=True, index=True)
    master_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)
    action = Column(String, nullable=False)
    payload = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    master = relationship("User")
    character = relationship("Character")

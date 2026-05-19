from sqlalchemy import Column, Integer, ForeignKey, String, DateTime
from datetime import datetime
from ..database.connection import Base


class FightInvite(Base):
    __tablename__ = "fight_invites"

    id = Column(Integer, primary_key=True, index=True)
    fight_id = Column(Integer, ForeignKey("fights.id"), nullable=False)
    user_id = Column(Integer, nullable=False)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=True)
    invited_by = Column(Integer, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)

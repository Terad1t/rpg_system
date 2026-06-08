from sqlalchemy import Column, Integer, ForeignKey, String, DateTime
from ..database.connection import Base
from datetime import datetime


class FightTurn(Base):
    __tablename__ = "fight_turns"

    id = Column(Integer, primary_key=True, index=True)
    fight_id = Column(Integer, ForeignKey("fights.id"), nullable=False, unique=True)
    current_user_id = Column(Integer, nullable=True)
    current_index = Column(Integer, default=0)
    phase = Column(String, default="waiting")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

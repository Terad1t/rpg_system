from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from ..database.connection import Base
from datetime import datetime


class FightEntry(Base):
    __tablename__ = "fight_entries"

    id = Column(Integer, primary_key=True, index=True)
    fight_id = Column(Integer, ForeignKey("fights.id"), nullable=False)
    actor_type = Column(String, nullable=False)  # player | enemy
    actor_name = Column(String, nullable=False)
    damage = Column(Integer, default=0)
    healing = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    fight = relationship("Fight", back_populates="entries")
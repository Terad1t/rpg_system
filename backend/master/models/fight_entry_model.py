from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..core.time import utcnow
from ..database.connection import Base


class FightEntry(Base):
    __tablename__ = "fight_entries"

    id = Column(Integer, primary_key=True, index=True)
    fight_id = Column(Integer, ForeignKey("fights.id"), nullable=False)
    actor_type = Column(String, nullable=False)  # player | enemy
    actor_name = Column(String, nullable=False)
    damage = Column(Integer, default=0)
    healing = Column(Integer, default=0)
    action = Column(String, nullable=True)
    value = Column(Integer, default=0)
    card_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    fight = relationship("Fight", back_populates="entries")

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from ..core.time import utcnow
from ..database.connection import Base


class Fight(Base):
    __tablename__ = "fights"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    started_at = Column(DateTime, default=utcnow)
    ended_at = Column(DateTime, nullable=True)
    status = Column(String, default="in_progress")
    duration_seconds = Column(Integer, default=0)
    total_player_damage = Column(Integer, default=0)
    total_enemy_damage = Column(Integer, default=0)
    total_player_healing = Column(Integer, default=0)
    total_enemy_healing = Column(Integer, default=0)
    player_damage_count = Column(Integer, default=0)
    enemy_damage_count = Column(Integer, default=0)
    player_healing_count = Column(Integer, default=0)
    enemy_healing_count = Column(Integer, default=0)

    entries = relationship("FightEntry", back_populates="fight", cascade="all, delete-orphan")

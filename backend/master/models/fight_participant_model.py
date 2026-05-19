from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..database.connection import Base


class FightParticipant(Base):
    __tablename__ = "fight_participants"

    id = Column(Integer, primary_key=True, index=True)
    fight_id = Column(Integer, ForeignKey("fights.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=True)

    # relationships (optional)
    # fight = relationship("Fight", back_populates="participants")
    # user = relationship("User")
    # character = relationship("Character")

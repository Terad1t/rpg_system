# models/player.py
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String
from database.connection import Base

class Player(BaseModel):
    id: int
    name: str
    hp: int

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    hp = Column(Integer, nullable=False)
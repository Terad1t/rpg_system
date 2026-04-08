from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CharacterRequestCreate(BaseModel):
    codename: Optional[str] = None
    name: str
    raca_id: int
    classe_id: int
    region_id: Optional[int] = None
    age: Optional[int] = None
    height: Optional[float] = None
    description: Optional[str] = None


class CharacterRequestRead(BaseModel):
    id: int
    user_id: int
    codename: Optional[str] = None
    name: str
    raca_id: int
    classe_id: int
    region_id: Optional[int] = None
    age: Optional[int] = None
    height: Optional[float] = None
    description: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CharacterApproval(BaseModel):
    subclass: Optional[str] = None
    hp: int
    vigor: int
    agility: int
    speed: int
    charisma: int
    intellect: int
    investigation: str  # basic/intermediate/advanced/forensic
    presence: int
    occultism: int

from pydantic import BaseModel
from typing import Optional

class VillageBase(BaseModel):
    country_id: int
    name: str
    description: Optional[str] = None
    image: Optional[str] = None

class VillageCreate(VillageBase):
    pass

class VillageRead(VillageBase):
    id: int

    class Config:
        from_attributes = True

class VillageUpdate(BaseModel):
    country_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
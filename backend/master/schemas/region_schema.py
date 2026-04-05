from pydantic import BaseModel
from typing import Optional

class RegionBase(BaseModel):
    name: str
    description: Optional[str] = None
    climate: Optional[str] = None

class RegionCreate(RegionBase):
    pass

class RegionRead(RegionBase):
    id: int

    class Config:
        from_attributes = True

class RegionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    climate: Optional[str] = None
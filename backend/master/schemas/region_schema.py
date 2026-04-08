from pydantic import BaseModel, Field
from typing import Optional


class RegionBase(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    climate: Optional[str] = None


class RegionCreate(RegionBase):
    pass


class RegionRead(RegionBase):
    id: int

    class Config:
        from_attributes = True


class RegionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    climate: Optional[str] = None
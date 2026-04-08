from pydantic import BaseModel, Field
from typing import Optional


class VillageBase(BaseModel):
    country_id: int = Field(..., ge=1)
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    image: Optional[str] = None


class VillageCreate(VillageBase):
    pass


class VillageRead(VillageBase):
    id: int

    class Config:
        from_attributes = True


class VillageUpdate(BaseModel):
    country_id: Optional[int] = Field(None, ge=1)
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    image: Optional[str] = None
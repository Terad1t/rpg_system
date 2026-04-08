from pydantic import BaseModel, Field
from typing import Optional


class CountryBase(BaseModel):
    region_id: int = Field(..., ge=1)
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    image: Optional[str] = None


class CountryCreate(CountryBase):
    pass


class CountryRead(CountryBase):
    id: int

    class Config:
        from_attributes = True


class CountryUpdate(BaseModel):
    region_id: Optional[int] = Field(None, ge=1)
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    image: Optional[str] = None
from pydantic import BaseModel
from typing import Optional

class CountryBase(BaseModel):
    region_id: int
    name: str
    description: Optional[str] = None
    image: Optional[str] = None

class CountryCreate(CountryBase):
    pass

class CountryRead(CountryBase):
    id: int

    class Config:
        from_attributes = True

class CountryUpdate(BaseModel):
    region_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
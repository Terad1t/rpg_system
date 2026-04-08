from pydantic import BaseModel
from typing import List, Optional


class MapBase(BaseModel):
    name: str
    image: Optional[str] = None
    description: Optional[str] = None
    allowed_races: Optional[List[int]] = []
    danger_level: Optional[str] = "none"
    map_type: Optional[str] = "region"


class MapCreate(MapBase):
    pass


class MapRead(MapBase):
    id: int

    class Config:
        from_attributes = True


class MapUpdate(BaseModel):
    name: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None
    allowed_races: Optional[List[int]] = None
    danger_level: Optional[str] = None
    map_type: Optional[str] = None

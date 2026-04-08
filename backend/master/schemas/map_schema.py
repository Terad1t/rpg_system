from pydantic import BaseModel, Field, field_validator
from typing import List, Optional


_DANGER_LEVELS = {"none", "medium", "high", "spiritual", "ascendant"}
_MAP_TYPES = {"residence", "shop", "village", "country", "region"}


class MapBase(BaseModel):
    name: str = Field(..., min_length=1)
    image: Optional[str] = None
    description: Optional[str] = None
    allowed_races: Optional[List[int]] = []
    danger_level: Optional[str] = "none"
    map_type: Optional[str] = "region"

    @field_validator("danger_level")
    def validate_danger_level(cls, v):
        if v is None:
            return v
        val = str(v).strip().lower()
        if val not in _DANGER_LEVELS:
            raise ValueError(f"invalid danger_level '{v}', expected one of: {_DANGER_LEVELS}")
        return val

    @field_validator("map_type")
    def validate_map_type(cls, v):
        if v is None:
            return v
        val = str(v).strip().lower()
        if val not in _MAP_TYPES:
            raise ValueError(f"invalid map_type '{v}', expected one of: {_MAP_TYPES}")
        return val


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

    @field_validator("danger_level")
    def validate_danger_level_opt(cls, v):
        if v is None:
            return v
        val = str(v).strip().lower()
        if val not in _DANGER_LEVELS:
            raise ValueError(f"invalid danger_level '{v}', expected one of: {_DANGER_LEVELS}")
        return val

    @field_validator("map_type")
    def validate_map_type_opt(cls, v):
        if v is None:
            return v
        val = str(v).strip().lower()
        if val not in _MAP_TYPES:
            raise ValueError(f"invalid map_type '{v}', expected one of: {_MAP_TYPES}")
        return val

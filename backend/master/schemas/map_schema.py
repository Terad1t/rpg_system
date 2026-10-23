from pydantic import BaseModel, ConfigDict, Field, field_validator

_DANGER_LEVELS = {"none", "medium", "high", "spiritual", "ascendant"}
_MAP_TYPES = {"residence", "shop", "village", "country", "region"}


class MapBase(BaseModel):
    name: str = Field(..., min_length=1)
    image: str | None = None
    description: str | None = None
    allowed_races: list[int] | None = []
    danger_level: str | None = "none"
    map_type: str | None = "region"
    region_id: int | None = None
    country_id: int | None = None
    village_id: int | None = None
    parent_map_id: int | None = None

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

    model_config = ConfigDict(from_attributes=True)


class MapUpdate(BaseModel):
    name: str | None = None
    image: str | None = None
    description: str | None = None
    allowed_races: list[int] | None = None
    danger_level: str | None = None
    map_type: str | None = None
    region_id: int | None = None
    country_id: int | None = None
    village_id: int | None = None
    parent_map_id: int | None = None

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

from pydantic import BaseModel, ConfigDict, Field


class RegionBase(BaseModel):
    name: str = Field(..., min_length=1)
    description: str | None = None
    climate: str | None = None


class RegionCreate(RegionBase):
    pass


class RegionRead(RegionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class RegionUpdate(BaseModel):
    name: str | None = Field(None, min_length=1)
    description: str | None = None
    climate: str | None = None

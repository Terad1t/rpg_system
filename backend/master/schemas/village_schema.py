from pydantic import BaseModel, ConfigDict, Field


class VillageBase(BaseModel):
    country_id: int = Field(..., ge=1)
    name: str = Field(..., min_length=1)
    description: str | None = None
    image: str | None = None


class VillageCreate(VillageBase):
    pass


class VillageRead(VillageBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class VillageUpdate(BaseModel):
    country_id: int | None = Field(None, ge=1)
    name: str | None = Field(None, min_length=1)
    description: str | None = None
    image: str | None = None

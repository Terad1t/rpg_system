from pydantic import BaseModel, ConfigDict, Field


class CountryBase(BaseModel):
    region_id: int = Field(..., ge=1)
    name: str = Field(..., min_length=1)
    description: str | None = None
    image: str | None = None


class CountryCreate(CountryBase):
    pass


class CountryRead(CountryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class CountryUpdate(BaseModel):
    region_id: int | None = Field(None, ge=1)
    name: str | None = Field(None, min_length=1)
    description: str | None = None
    image: str | None = None

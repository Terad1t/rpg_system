from pydantic import BaseModel, ConfigDict, Field


class RacaCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: str | None = None
    image: str | None = None


class RacaUpdate(BaseModel):
    name: str | None = Field(None, min_length=1)
    description: str | None = None
    image: str | None = None


class RacaRead(BaseModel):
    id: int
    name: str
    description: str | None = None
    image: str | None = None

    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, ConfigDict, Field


class ClasseCreate(BaseModel):
    name: str = Field(..., min_length=1)
    subclass: str | None = None
    description: str | None = None


class ClasseUpdate(BaseModel):
    name: str | None = Field(None, min_length=1)
    subclass: str | None = None
    description: str | None = None


class ClasseRead(BaseModel):
    id: int
    name: str
    subclass: str | None = None
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)

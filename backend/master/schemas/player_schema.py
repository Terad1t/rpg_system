from pydantic import BaseModel

class PlayerCreate(BaseModel):
    name: str
    hp: int

class PlayerUpdate(BaseModel):
    name: str | None = None
    hp: int | None = None

class PlayerResponse(BaseModel):
    id: int
    name: str
    hp: int

    class Config:
        from_attributes = True
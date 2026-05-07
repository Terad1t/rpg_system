from pydantic import BaseModel, Field
from typing import Optional

class RacaCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    image: Optional[str] = None

class RacaUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None

class RacaRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    image: Optional[str] = None

    class Config:
        from_attributes = True

from pydantic import BaseModel, Field
from typing import Optional

class ClasseCreate(BaseModel):
    name: str = Field(..., min_length=1)
    subclass: Optional[str] = None
    description: Optional[str] = None

class ClasseUpdate(BaseModel):
    name: Optional[str] = None
    subclass: Optional[str] = None
    description: Optional[str] = None

class ClasseRead(BaseModel):
    id: int
    name: str
    subclass: Optional[str] = None
    description: Optional[str] = None

    class Config:
        orm_mode = True

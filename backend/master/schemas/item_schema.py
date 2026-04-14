from pydantic import BaseModel, Field
from typing import Optional

class ItemCreate(BaseModel):
    name: str = Field(..., min_length=1)
    tipo: str = Field(..., min_length=1)
    image: Optional[str] = None
    description: Optional[str] = None
    quantidade_maxima: Optional[int] = 1

class ItemRead(BaseModel):
    id: int
    name: str
    tipo: str
    image: Optional[str]
    description: Optional[str]
    quantidade_maxima: int

    class Config:
        orm_mode = True

class ItemUpdate(BaseModel):
    name: Optional[str]
    tipo: Optional[str]
    image: Optional[str]
    description: Optional[str]
    quantidade_maxima: Optional[int]

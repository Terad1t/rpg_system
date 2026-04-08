from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PlayerNoteCreate(BaseModel):
    content: str


class PlayerNoteRead(BaseModel):
    id: int
    user_id: int
    content: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

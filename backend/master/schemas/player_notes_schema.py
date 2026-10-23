from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PlayerNoteCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class PlayerNoteRead(BaseModel):
    id: int
    user_id: int
    content: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

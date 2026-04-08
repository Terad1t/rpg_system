from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

_STATUS = {"pending", "approved", "rejected"}
_INVESTIGATION_LEVELS = {"basic", "intermediate", "advanced", "forensic"}


class CharacterRequestCreate(BaseModel):
    codename: Optional[str] = Field(None, min_length=1, max_length=50)
    name: str = Field(..., min_length=1)
    raca_id: int = Field(..., ge=1)
    classe_id: int = Field(..., ge=1)
    region_id: Optional[int] = Field(None, ge=1)
    age: Optional[int] = None
    height: Optional[float] = None
    description: Optional[str] = Field(None, max_length=2000)

    @field_validator("age")
    def validate_age(cls, v):
        if v is None:
            return v
        if v < 0:
            raise ValueError("age must be >= 0")
        return v

    @field_validator("height")
    def validate_height(cls, v):
        if v is None:
            return v
        if v <= 0:
            raise ValueError("height must be > 0")
        return v


class CharacterRequestRead(BaseModel):
    id: int
    user_id: int
    codename: Optional[str] = None
    name: str
    raca_id: int
    classe_id: int
    region_id: Optional[int] = None
    age: Optional[int] = None
    height: Optional[float] = None
    description: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None

    @field_validator("status")
    def validate_status(cls, v):
        val = str(v).strip().lower()
        if val not in _STATUS:
            raise ValueError(f"invalid status '{v}', expected one of: {_STATUS}")
        return val

    class Config:
        from_attributes = True


class CharacterApproval(BaseModel):
    subclass: Optional[str] = None
    hp: int = Field(..., ge=1)
    vigor: int = Field(..., ge=0, le=100)
    agility: int = Field(..., ge=0, le=100)
    speed: int = Field(..., ge=0, le=100)
    charisma: int = Field(..., ge=0, le=100)
    intellect: int = Field(..., ge=0, le=100)
    investigation: str  # basic/intermediate/advanced/forensic
    presence: int = Field(..., ge=0, le=100)
    occultism: int = Field(..., ge=0, le=100)

    @field_validator("investigation")
    def validate_investigation(cls, v):
        val = str(v).strip().lower()
        if val not in _INVESTIGATION_LEVELS:
            raise ValueError(f"invalid investigation level '{v}', expected one of: {_INVESTIGATION_LEVELS}")
        return val

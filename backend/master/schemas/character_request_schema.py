from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

_STATUS = {"pending", "approved", "rejected"}
_INVESTIGATION_LEVELS = {"basic", "intermediate", "advanced", "forensic"}


class CharacterRequestCreate(BaseModel):
    codename: str | None = Field(None, min_length=1, max_length=50)
    name: str = Field(..., min_length=1)
    raca_id: int = Field(..., ge=1)
    classe_id: int = Field(..., ge=1)
    region_id: int | None = Field(None, ge=1)
    age: int | None = None
    height: float | None = None
    description: str | None = Field(None, max_length=2000)

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
    codename: str | None = None
    name: str
    raca_id: int
    classe_id: int
    region_id: int | None = None
    age: int | None = None
    height: float | None = None
    description: str | None = None
    status: str
    created_at: datetime | None = None
    approved_by: int | None = None
    approved_at: datetime | None = None

    @field_validator("status")
    def validate_status(cls, v):
        val = str(v).strip().lower()
        if val not in _STATUS:
            raise ValueError(f"invalid status '{v}', expected one of: {_STATUS}")
        return val

    model_config = ConfigDict(from_attributes=True)


class CharacterApproval(BaseModel):
    subclass: str | None = None
    hp: int = Field(1, ge=1)
    vigor: int = Field(0, ge=0, le=100)
    agility: int = Field(0, ge=0, le=100)
    speed: int = Field(0, ge=0, le=100)
    charisma: int = Field(0, ge=0, le=100)
    intellect: int = Field(0, ge=0, le=100)
    investigation: str = Field("basic")  # basic/intermediate/advanced/forensic
    presence: int = Field(0, ge=0, le=100)
    occultism: int = Field(0, ge=0, le=100)

    @field_validator("investigation")
    def validate_investigation(cls, v):
        val = str(v).strip().lower()
        if val not in _INVESTIGATION_LEVELS:
            raise ValueError(f"invalid investigation level '{v}', expected one of: {_INVESTIGATION_LEVELS}")
        return val

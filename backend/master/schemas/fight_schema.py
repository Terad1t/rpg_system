from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field, field_validator


_STATUSES = {"in_progress", "finished", "paused"}
_ACTOR_TYPES = {"player", "enemy"}


class FightEntryCreate(BaseModel):
    actor_type: str = Field(...)
    actor_name: str = Field(..., min_length=1)
    damage: int = Field(0, ge=0)
    healing: int = Field(0, ge=0)

    @field_validator("actor_type")
    def validate_actor_type(cls, value):
        value = str(value).strip().lower()
        if value not in _ACTOR_TYPES:
            raise ValueError(f"invalid actor_type '{value}'")
        return value


class FightEntryRead(FightEntryCreate):
    id: int
    fight_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class FightCreate(BaseModel):
    name: str = Field(..., min_length=1)
    started_at: Optional[datetime] = None
    status: str = "in_progress"
    duration_seconds: int = 0

    @field_validator("status")
    def validate_status(cls, value):
        value = str(value).strip().lower()
        if value not in _STATUSES:
            raise ValueError(f"invalid status '{value}'")
        return value


class FightUpdate(BaseModel):
    name: Optional[str] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    status: Optional[str] = None
    duration_seconds: Optional[int] = Field(None, ge=0)

    @field_validator("status")
    def validate_status(cls, value):
        if value is None:
            return value
        value = str(value).strip().lower()
        if value not in _STATUSES:
            raise ValueError(f"invalid status '{value}'")
        return value


class FightRead(BaseModel):
    id: int
    name: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: str
    duration_seconds: int
    total_player_damage: int
    total_enemy_damage: int
    total_player_healing: int
    total_enemy_healing: int
    player_damage_count: int
    enemy_damage_count: int
    player_healing_count: int
    enemy_healing_count: int
    entries: List[FightEntryRead] = []

    class Config:
        from_attributes = True
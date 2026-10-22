from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

_STATUSES = {"in_progress", "finished", "paused"}
_ACTOR_TYPES = {"player", "enemy"}


class FightEntryCreate(BaseModel):
    actor_type: str = Field(...)
    actor_name: str = Field(..., min_length=1)
    damage: int = Field(0, ge=0)
    healing: int = Field(0, ge=0)
    action: str | None = None
    value: int | None = None
    card_id: int | None = None

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
    action: str | None = None
    value: int | None = None
    card_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


class FightCreate(BaseModel):
    name: str = Field(..., min_length=1)
    started_at: datetime | None = None
    status: str = "in_progress"
    duration_seconds: int = 0

    @field_validator("status")
    def validate_status(cls, value):
        value = str(value).strip().lower()
        if value not in _STATUSES:
            raise ValueError(f"invalid status '{value}'")
        return value


class FightUpdate(BaseModel):
    name: str | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    status: str | None = None
    duration_seconds: int | None = Field(None, ge=0)

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
    ended_at: datetime | None = None
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
    entries: list[FightEntryRead] = []

    model_config = ConfigDict(from_attributes=True)


_PLAYER_ACTIONS = {"attack", "heal", "defend", "skill", "ready"}


class FightInviteRequest(BaseModel):
    user_ids: list[int] = Field(..., min_length=1, max_length=50)
    expires_in: int = Field(20, ge=5, le=300)


class FightInviteAnswer(BaseModel):
    accept: bool


class PlayerFightAction(BaseModel):
    action: str
    value: int = Field(0, ge=0, le=100_000)
    card_id: int | None = None
    actor_character_id: int | None = None
    target_character_id: int | None = None

    @field_validator("action")
    def validate_action(cls, value):
        value = str(value).strip().lower()
        if value not in _PLAYER_ACTIONS:
            raise ValueError(f"invalid action '{value}'")
        return value


class FightResponses(BaseModel):
    fight_id: int
    accepted: list[int]
    declined: list[int]
    pending: list[int]


class FightTurnRead(BaseModel):
    fight_id: int
    current_user_id: int | None = None
    current_index: int | None = None
    phase: str | None = None
    is_my_turn: bool = False

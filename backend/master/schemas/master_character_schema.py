from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

_VisibilityRule = Literal["public", "owner_only", "same_map", "same_party", "friends", "allow_list"]
_PublicField = Literal["codename", "race", "class", "status", "portrait"]


class CharacterVisibility(BaseModel):
    """O que outros jogadores enxergam da ficha."""

    show_hp: bool = False
    show_mana: bool = False
    show_buffs: bool = False
    show_debuffs: bool = False
    rule: _VisibilityRule = "public"
    allow_user_ids: list[int] = Field(default_factory=list, max_length=100)
    friend_user_ids: list[int] = Field(default_factory=list, max_length=100)
    public_fields: list[_PublicField] = Field(default_factory=lambda: ["codename", "race", "class", "status"])


class CharacterQuickUpdate(BaseModel):
    """Ações rápidas do Master. `hp` e `mana` são variações (dano negativo, cura positiva)."""

    model_config = ConfigDict(extra="forbid")

    hp: int | None = Field(None, ge=-100_000, le=100_000)
    mana: int | None = Field(None, ge=-100_000, le=100_000)
    buffs: str | list | None = None
    debuffs: str | list | None = None
    add_buff: str | None = Field(None, min_length=1, max_length=100)
    remove_buff: str | None = Field(None, min_length=1, max_length=100)
    add_debuff: str | None = Field(None, min_length=1, max_length=100)
    remove_debuff: str | None = Field(None, min_length=1, max_length=100)
    buff_duration_seconds: int | None = Field(None, ge=0, le=7 * 24 * 3600)
    debuff_duration_seconds: int | None = Field(None, ge=0, le=7 * 24 * 3600)
    narrative: str | None = Field(None, max_length=2000)
    note: str | None = Field(None, max_length=2000)

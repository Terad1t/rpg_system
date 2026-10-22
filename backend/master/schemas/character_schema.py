from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from ..core.uploads import is_safe_image_reference

# ========== SCHEMAS DO MASTER ==========

_TIPOS = {"player", "npc", "boss"}


class CharacterCreateByMaster(BaseModel):
    """Criação de personagem pelo Master (completo)"""

    name: str = Field(..., min_length=1)
    age: int | None = None
    tipo: str = Field(...)
    raca_id: int = Field(..., ge=1)
    classe_id: int = Field(..., ge=1)
    user_id: int | None = None
    current_map_id: int | None = None

    @field_validator("tipo")
    def normalize_tipo(cls, v):
        if v is None:
            raise ValueError("tipo is required and must be one of: player, npc, boss")
        val = str(v).strip().lower()
        if val not in _TIPOS:
            raise ValueError(f"invalid tipo '{v}', expected one of: {_TIPOS}")
        return val

    @field_validator("age")
    def validate_age(cls, v):
        if v is None:
            return v
        if v < 0:
            raise ValueError("age must be >= 0")
        return v

    @model_validator(mode="after")
    def check_player_has_user(self):
        # If this character is a player, user_id must be provided
        if self.tipo == "player" and self.user_id is None:
            raise ValueError("user_id is required when tipo == 'player'")
        return self


class CharacterUpdateByMaster(BaseModel):
    """Atualização pelo Master (permite alterar quase tudo)"""

    name: str | None = Field(None, min_length=1)
    age: int | None = None
    tipo: str | None = None
    raca_id: int | None = None
    classe_id: int | None = None
    user_id: int | None = None
    current_map_id: int | None = None
    hp: int | None = None
    max_hp: int | None = None
    mana: int | None = None
    max_mana: int | None = None
    buffs: str | None = None
    debuffs: str | None = None

    @field_validator("tipo")
    def normalize_tipo_opt(cls, v):
        if v is None:
            return v
        val = str(v).strip().lower()
        if val not in _TIPOS:
            raise ValueError(f"invalid tipo '{v}', expected one of: {_TIPOS}")
        return val

    @field_validator("age")
    def validate_age_opt(cls, v):
        if v is None:
            return v
        if v < 0:
            raise ValueError("age must be >= 0")
        return v


# ========== SCHEMAS DO PLAYER ==========


class CharacterUpdateByPlayer(BaseModel):
    """Atualização pelo Player (codinome, descrição e portrait)"""

    codename: str | None = Field(None, min_length=1, max_length=50)
    description: str | None = Field(None, max_length=2000)
    portrait: str | None = Field(None, max_length=2000)

    @field_validator("portrait")
    def validate_portrait(cls, v):
        if v is None or v == "":
            return v or None
        if not is_safe_image_reference(v):
            raise ValueError("portrait must be an http(s) URL or an uploaded image path")
        return v


# ========== SCHEMAS DE LEITURA ==========


class CharacterRead(BaseModel):
    id: int
    name: str
    age: int | None = None
    tipo: str
    raca_id: int
    classe_id: int
    codename: str | None = None
    description: str | None = None
    portrait: str | None = None
    hp: int | None = None
    max_hp: int | None = None
    mana: int | None = None
    max_mana: int | None = None
    buffs: str | None = None
    debuffs: str | None = None
    user_id: int | None = None
    current_map_id: int | None = None
    free_points: int | None = None
    total_points_distributed: int | None = None

    model_config = ConfigDict(from_attributes=True)

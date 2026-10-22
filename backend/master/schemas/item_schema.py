from pydantic import BaseModel, ConfigDict, Field


class ItemCreate(BaseModel):
    name: str = Field(..., min_length=1)
    tipo: str = Field(..., min_length=1)
    image: str | None = None
    description: str | None = None
    buffs: str | None = None
    nerfs: str | None = None
    quantity: int | None = Field(1, ge=0)
    quantidade_maxima: int | None = Field(1, ge=0)


class ItemRead(BaseModel):
    id: int
    name: str
    tipo: str
    image: str | None = None
    description: str | None = None
    buffs: str | None = None
    nerfs: str | None = None
    quantity: int | None = 1
    quantidade_maxima: int | None = 1

    model_config = ConfigDict(from_attributes=True)


class ItemUpdate(BaseModel):
    name: str | None = Field(None, min_length=1)
    tipo: str | None = Field(None, min_length=1)
    image: str | None = None
    description: str | None = None
    buffs: str | None = None
    nerfs: str | None = None
    quantity: int | None = Field(None, ge=0)
    quantidade_maxima: int | None = Field(None, ge=0)


class InventoryEntryRead(BaseModel):
    id: int
    character_id: int
    item_id: int
    quantidade: int
    item: ItemRead | None = None

    model_config = ConfigDict(from_attributes=True)

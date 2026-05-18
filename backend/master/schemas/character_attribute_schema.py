from pydantic import BaseModel
from typing import Optional


class CharacterAttributeRead(BaseModel):
    attribute_name: str
    base_value: int
    distributed_points: int
    equipment_bonus: int
    buff_multiplier: float
    total_value: int

    class Config:
        from_attributes = True


class DistributePointRequest(BaseModel):
    attribute_name: str
    points_to_add: int = 1

    class Config:
        from_attributes = True


class DistributePointResponse(BaseModel):
    free_points: int
    attributes: list[CharacterAttributeRead]

    class Config:
        from_attributes = True

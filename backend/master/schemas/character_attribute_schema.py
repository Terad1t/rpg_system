from pydantic import BaseModel, ConfigDict, Field


class CharacterAttributeRead(BaseModel):
    attribute_name: str
    base_value: int
    distributed_points: int
    equipment_bonus: int
    buff_multiplier: float
    total_value: int

    model_config = ConfigDict(from_attributes=True)


class DistributePointRequest(BaseModel):
    attribute_name: str
    points_to_add: int = Field(1, ge=1, le=100)


class DistributePointResponse(BaseModel):
    free_points: int
    attributes: list[CharacterAttributeRead]

    model_config = ConfigDict(from_attributes=True)

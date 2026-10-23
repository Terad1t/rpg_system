from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

_CHAT_MESSAGE_TYPES = {"message", "user_joined", "user_left", "error", "history", "system"}


class ChatMessageCreate(BaseModel):
    """Dados para criar uma mensagem de chat"""

    message: str = Field(..., min_length=1, max_length=1000)


class ChatMessageRead(BaseModel):
    """Leitura de mensagem de chat"""

    id: int
    user_id: int
    username: str
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatMessageBroadcast(BaseModel):
    """Formato de mensagem enviada via WebSocket"""

    id: int | None = None
    user_id: int
    username: str
    message: str
    created_at: str | None = None
    message_type: str = "message"  # "message", "user_joined", "user_left", "error", "history", "system"

    @field_validator("message_type")
    def validate_message_type(cls, v):
        val = str(v).strip().lower()
        if val not in _CHAT_MESSAGE_TYPES:
            raise ValueError(f"invalid message_type '{v}', expected one of: {_CHAT_MESSAGE_TYPES}")
        return val


class ChatHistoryResponse(BaseModel):
    """Resposta com histórico de chat"""

    messages: list[ChatMessageRead]
    total: int

from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional

_CHAT_MESSAGE_TYPES = {"message", "user_joined", "user_left", "error"}


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

    class Config:
        from_attributes = True


class ChatMessageBroadcast(BaseModel):
    """Formato de mensagem enviada via WebSocket"""
    id: Optional[int] = None
    user_id: int
    username: str
    message: str
    created_at: Optional[str] = None
    message_type: str = "message"  # "message", "user_joined", "user_left", "error"

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
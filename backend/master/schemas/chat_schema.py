from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

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

class ChatHistoryResponse(BaseModel):
    """Resposta com histórico de chat"""
    messages: list[ChatMessageRead]
    total: int
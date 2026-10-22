from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from ..core.time import utcnow
from ..database.connection import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    username = Column(String, nullable=False)  # Armazenar nome exibido para referência
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    # Relacionamento
    user = relationship("User")

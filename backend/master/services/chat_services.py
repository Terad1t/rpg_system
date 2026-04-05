from sqlalchemy.orm import Session
from models.chat_message_model import ChatMessage
from schemas.chat_schema import ChatMessageCreate
from datetime import datetime

def create_chat_message(db: Session, user_id: int, username: str, message_data: ChatMessageCreate) -> ChatMessage:
    """Salva uma mensagem no banco de dados"""
    db_message = ChatMessage(
        user_id=user_id,
        username=username,
        message=message_data.message
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_chat_history(db: Session, limit: int = 50, offset: int = 0) -> tuple[list[ChatMessage], int]:
    """Obtém histórico de mensagens do chat"""
    total = db.query(ChatMessage).count()
    messages = db.query(ChatMessage).order_by(ChatMessage.created_at.desc()).offset(offset).limit(limit).all()
    # Reverte a ordem para ter as mais antigas primeiro
    messages.reverse()
    return messages, total

def get_recent_messages(db: Session, limit: int = 50) -> list[ChatMessage]:
    """Obtém as mensagens mais recentes"""
    return db.query(ChatMessage).order_by(ChatMessage.created_at.desc()).limit(limit).all()[::-1]

def delete_old_messages(db: Session, days: int = 30) -> int:
    """Deleta mensagens antigas (para manutenção do banco)"""
    from datetime import timedelta
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    deleted_count = db.query(ChatMessage).filter(ChatMessage.created_at < cutoff_date).delete()
    db.commit()
    return deleted_count
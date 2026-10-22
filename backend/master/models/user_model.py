from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from ..core.time import utcnow
from ..database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    login = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    pin_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "master" ou "player"
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relacionamento
    creator = relationship("User", remote_side=[id], backref="created_users")

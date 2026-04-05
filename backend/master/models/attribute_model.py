from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database.connection import Base

class Attribute(Base):
    __tablename__ = "attributes"

    id = Column(Integer, primary_key=True, index=True)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=False)
    name = Column(String, nullable=False)  # força, velocidade, etc.
    value = Column(Integer, nullable=False)

    # Relacionamento
    character = relationship("Character", back_populates="attributes")
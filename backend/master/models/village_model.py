from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database.connection import Base

class Village(Base):
    __tablename__ = "villages"

    id = Column(Integer, primary_key=True, index=True)
    country_id = Column(Integer, ForeignKey("countries.id"), nullable=False)
    name = Column(String, nullable=False, unique=True)
    description = Column(String)
    image = Column(String)  # caminho da imagem

    # Relacionamento
    country = relationship("Country", back_populates="villages")
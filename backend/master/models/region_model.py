from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..database.connection import Base

class Region(Base):
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(String)
    climate = Column(String)  # clima da região

    # Relacionamentos
    countries = relationship("Country", back_populates="region")
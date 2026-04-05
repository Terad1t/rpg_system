from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database.connection import Base

class Country(Base):
    __tablename__ = "countries"

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=False)
    name = Column(String, nullable=False, unique=True)
    description = Column(String)
    image = Column(String)  # caminho da imagem

    # Relacionamentos
    region = relationship("Region", back_populates="countries")
    villages = relationship("Village", back_populates="country")
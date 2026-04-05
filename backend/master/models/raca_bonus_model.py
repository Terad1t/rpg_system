from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database.connection import Base

class RacaBonus(Base):
    __tablename__ = "raca_bonus"

    id = Column(Integer, primary_key=True, index=True)
    raca_id = Column(Integer, ForeignKey("racas.id"), nullable=False)
    attribute_name = Column(String, nullable=False)  # força, velocidade, etc.
    bonus = Column(Integer, nullable=False)  # +2 ou -1

    # Relacionamento
    raca = relationship("Raca", back_populates="raca_bonus")
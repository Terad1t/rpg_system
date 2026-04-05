from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database.connection import Base

class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True)
    # Dados imutáveis (definidos na criação)
    name = Column(String, nullable=False)  # Nome do personagem (imutável)
    age = Column(Integer)  # Idade (imutável)
    tipo = Column(String, nullable=False)  # player, npc, boss
    raca_id = Column(Integer, ForeignKey("racas.id"), nullable=False)
    classe_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    
    # Dados editáveis pelo player (se for player)
    codename = Column(String)  # Codinome do personagem (editável)
    description = Column(String)  # Descrição/lore do personagem (editável)
    
    # Relacionamento com usuário (opcional, para players)
    user_id = Column(String)  # ID do usuário que controla esse personagem (se for player)

    # Relacionamentos
    raca = relationship("Raca", back_populates="characters")
    classe = relationship("Classe", back_populates="characters")
    attributes = relationship("Attribute", back_populates="character")
    inventario = relationship("Inventario", back_populates="character")
    batalha_participantes = relationship("BatalhaParticipante", back_populates="character")
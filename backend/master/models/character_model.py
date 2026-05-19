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
    subclass = Column(String, nullable=True)  # Subclasse definida pelo Master
    
    # Dados editáveis pelo player (se for player)
    codename = Column(String)  # Codinome do personagem (editável)
    description = Column(String)  # Descrição/lore do personagem (editável)
    portrait = Column(String, nullable=True)  # Foto/portrait do personagem
    hp = Column(Integer, nullable=True)
    max_hp = Column(Integer, nullable=True)
    mana = Column(Integer, nullable=True)
    max_mana = Column(Integer, nullable=True)
    buffs = Column(String, nullable=True)
    debuffs = Column(String, nullable=True)
    free_points = Column(Integer, default=0)
    total_points_distributed = Column(Integer, default=0)
    # JSON string com controle de visibilidade definido pelo mestre. Ex: '{"show_hp": false, "public_fields": ["codename","race"]}'
    visibility = Column(String, nullable=True)
    
    # Relacionamento com usuário (opcional, para players)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    current_map_id = Column(Integer, ForeignKey("maps.id"), nullable=True)

    # Relationship to User
    user = relationship("User")
    current_map = relationship("Map")

    # Relacionamentos
    raca = relationship("Raca", back_populates="characters")
    classe = relationship("Classe", back_populates="characters")
    character_attributes_link = relationship("CharacterAttribute", back_populates="character")
    inventario = relationship("Inventario", back_populates="character")
    batalha_participantes = relationship("BatalhaParticipante", back_populates="character")
    habilidades_assigned = relationship("CharacterHabilidade", back_populates="character")

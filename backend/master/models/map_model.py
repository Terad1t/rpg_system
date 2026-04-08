from sqlalchemy import Column, Integer, String, Text, Table, ForeignKey
from sqlalchemy.orm import relationship
from ..database.connection import Base


maps_racas = Table(
    "maps_racas",
    Base.metadata,
    Column("map_id", Integer, ForeignKey("maps.id"), primary_key=True),
    Column("raca_id", Integer, ForeignKey("racas.id"), primary_key=True),
)


class Map(Base):
    __tablename__ = "maps"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    image = Column(String)
    description = Column(Text)
    danger_level = Column(String, default="none")
    map_type = Column(String, default="region")

    # Relação many-to-many com raças
    racas = relationship("Raca", secondary=maps_racas, back_populates="maps")

    @property
    def allowed_races(self):
        return [r.id for r in self.racas]

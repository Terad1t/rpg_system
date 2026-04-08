from sqlalchemy.orm import Session
from ..models.map_model import Map
from ..models.raca_model import Raca
from ..schemas.map_schema import MapCreate, MapUpdate


def get_maps(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Map).offset(skip).limit(limit).all()


def get_map_by_id(db: Session, map_id: int):
    return db.query(Map).filter(Map.id == map_id).first()


def create_map(db: Session, map_in: MapCreate):
    db_map = Map(
        name=map_in.name,
        image=map_in.image,
        description=map_in.description,
        danger_level=map_in.danger_level,
        map_type=map_in.map_type,
    )
    # Associate racas if provided
    if map_in.allowed_races:
        racas = db.query(Raca).filter(Raca.id.in_(map_in.allowed_races)).all()
        db_map.racas = racas

    db.add(db_map)
    db.commit()
    db.refresh(db_map)
    return db_map


def update_map(db: Session, map_id: int, map_update: MapUpdate):
    db_map = db.query(Map).filter(Map.id == map_id).first()
    if not db_map:
        return None

    for key, value in map_update.model_dump(exclude_unset=True).items():
        if key == "allowed_races":
            if value is None:
                db_map.racas = []
            else:
                racas = db.query(Raca).filter(Raca.id.in_(value)).all()
                db_map.racas = racas
        else:
            setattr(db_map, key, value)

    db.commit()
    db.refresh(db_map)
    return db_map


def delete_map(db: Session, map_id: int):
    db_map = db.query(Map).filter(Map.id == map_id).first()
    if db_map:
        db.delete(db_map)
        db.commit()
    return db_map

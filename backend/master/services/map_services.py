from sqlalchemy.orm import Session
from ..models.map_model import Map
from ..models.raca_model import Raca
from ..schemas.map_schema import MapCreate, MapUpdate
from ..models.region_model import Region
from ..models.country_model import Country
from ..models.village_model import Village


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


def build_map_tree(db: Session):
    regions = db.query(Region).all()
    countries = db.query(Country).all()
    villages = db.query(Village).all()
    maps = db.query(Map).all()

    maps_by_parent: dict[int | None, list[Map]] = {}
    maps_by_village: dict[int | None, list[Map]] = {}
    maps_by_country: dict[int | None, list[Map]] = {}
    maps_by_region: dict[int | None, list[Map]] = {}

    for map_item in maps:
        maps_by_parent.setdefault(map_item.parent_map_id, []).append(map_item)
        maps_by_village.setdefault(map_item.village_id, []).append(map_item)
        maps_by_country.setdefault(map_item.country_id, []).append(map_item)
        maps_by_region.setdefault(map_item.region_id, []).append(map_item)

    def serialize_map(map_item: Map):
        return {
            "id": map_item.id,
            "name": map_item.name,
            "image": map_item.image,
            "description": map_item.description,
            "danger_level": map_item.danger_level,
            "map_type": map_item.map_type,
            "region_id": map_item.region_id,
            "country_id": map_item.country_id,
            "village_id": map_item.village_id,
            "parent_map_id": map_item.parent_map_id,
            "allowed_races": map_item.allowed_races,
            "children": [serialize_map(child) for child in maps_by_parent.get(map_item.id, [])],
        }

    world = []
    for region in regions:
        region_countries = []
        for country in [country for country in countries if country.region_id == region.id]:
            country_villages = []
            for village in [village for village in villages if village.country_id == country.id]:
                village_maps = [
                    serialize_map(map_item)
                    for map_item in maps_by_village.get(village.id, [])
                    if map_item.parent_map_id is None
                ]
                country_villages.append(
                    {
                        "id": village.id,
                        "name": village.name,
                        "description": village.description,
                        "image": village.image,
                        "maps": village_maps,
                    }
                )

            country_maps = [
                serialize_map(map_item)
                for map_item in maps_by_country.get(country.id, [])
                if map_item.village_id is None and map_item.parent_map_id is None
            ]
            region_countries.append(
                {
                    "id": country.id,
                    "name": country.name,
                    "description": country.description,
                    "image": country.image,
                    "maps": country_maps,
                    "villages": country_villages,
                }
            )

        region_maps = [
            serialize_map(map_item)
            for map_item in maps_by_region.get(region.id, [])
            if map_item.country_id is None and map_item.parent_map_id is None
        ]
        world.append(
            {
                "id": region.id,
                "name": region.name,
                "description": region.description,
                "climate": region.climate,
                "maps": region_maps,
                "countries": region_countries,
            }
        )

    return world

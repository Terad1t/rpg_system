"""Popula o banco com dados de exemplo (raças, classes, itens e um mapa).

Uso:
    uv run python -m scripts.seed_demo

Só insere o que ainda não existe, então pode rodar mais de uma vez.
Não cria usuários: use `scripts.create_user` para isso.
"""

from backend.master import models  # noqa: F401  (registra os modelos)
from backend.master.database.connection import Base, SessionLocal, engine
from backend.master.models import Classe, Country, Item, Map, Raca, Region, Village

RACES = [
    ("Humano", "Versátil e adaptável"),
    ("Elfo", "Ágil e sábio"),
    ("Anão", "Forte e resistente"),
    ("Orc", "Poderoso e feroz"),
    ("Meio-Elfo", "Combinação de humano e elfo"),
]

CLASSES = [
    ("Guerreiro", "Especialista em combate corpo a corpo"),
    ("Mago", "Manipulador de magia"),
    ("Arqueiro", "Especialista em arco e flecha"),
    ("Ladino", "Rápido e furtivo"),
    ("Clérigo", "Curador e devoto"),
    ("Paladino", "Guerreiro sagrado"),
]

ITEMS = [
    ("Poção de Vida", "consumivel", "Recupera 20 de HP"),
    ("Espada Curta", "arma", "Lâmina leve de ferro"),
    ("Escudo de Madeira", "armadura", "Bloqueia golpes simples"),
]


def _ensure(db, model, name: str, **fields):
    if db.query(model).filter(model.name == name).first() is None:
        db.add(model(name=name, **fields))
        return 1
    return 0


def main() -> None:
    Base.metadata.create_all(bind=engine)
    created = 0
    with SessionLocal() as db:
        for name, description in RACES:
            created += _ensure(db, Raca, name, description=description)
        for name, description in CLASSES:
            created += _ensure(db, Classe, name, description=description)
        for name, tipo, description in ITEMS:
            created += _ensure(db, Item, name, tipo=tipo, description=description, quantity=1, quantidade_maxima=1)
        db.flush()

        if db.query(Region).count() == 0:
            region = Region(name="Planícies Centrais", description="Campos abertos e estradas comerciais", climate="Temperado")
            db.add(region)
            db.flush()
            country = Country(region_id=region.id, name="Reino de Aldor", description="Reino agrícola e pacífico")
            db.add(country)
            db.flush()
            village = Village(country_id=country.id, name="Vila do Carvalho", description="Ponto de partida dos aventureiros")
            db.add(village)
            db.flush()
            db.add(Map(name="Taverna do Carvalho", map_type="shop", danger_level="none", village_id=village.id))
            created += 4

        db.commit()
    print(f"Seed concluído: {created} registro(s) novo(s).")


if __name__ == "__main__":
    main()

from sqlalchemy import create_engine, inspect, text

from backend.master.database.connection import Base
from backend.master.utils.schema_migration import ensure_schema_updates

LEGACY_CHARACTERS = """
CREATE TABLE characters (
    id INTEGER NOT NULL,
    name VARCHAR NOT NULL,
    age INTEGER,
    tipo VARCHAR NOT NULL,
    raca_id INTEGER NOT NULL,
    classe_id INTEGER NOT NULL,
    codename VARCHAR,
    description VARCHAR,
    user_id VARCHAR,
    PRIMARY KEY (id)
)
"""


def test_legacy_text_user_id_is_rebuilt_as_integer(tmp_path):
    engine = create_engine(f"sqlite:///{(tmp_path / 'legacy.db').as_posix()}")
    with engine.begin() as connection:
        connection.execute(text(LEGACY_CHARACTERS))
        connection.execute(
            text("INSERT INTO characters (id, name, tipo, raca_id, classe_id, user_id) VALUES (1, 'Aria', 'player', 1, 1, '4')")
        )

    Base.metadata.create_all(bind=engine)
    changes = ensure_schema_updates(engine, Base.metadata)

    assert changes == ["characters.user_id -> INTEGER"]
    with engine.connect() as connection:
        row = connection.execute(text("SELECT user_id, typeof(user_id), name FROM characters")).one()
    assert row == (4, "integer", "Aria")
    declared = {col["name"]: str(col["type"]) for col in inspect(engine).get_columns("characters")}
    assert declared["user_id"] == "INTEGER"
    assert "hp" in declared  # a tabela recriada já vem com as colunas novas do modelo

    # Rodar de novo não muda nada.
    assert ensure_schema_updates(engine, Base.metadata) == []

"""Ajustes de schema para bancos criados por versões antigas do sistema.

`Base.metadata.create_all` cria tabelas que faltam, mas não adiciona colunas
novas em tabelas existentes. Esta função adiciona as colunas que versões
anteriores não tinham. Usa o inspector do SQLAlchemy, então não depende de SQLite.
"""

from __future__ import annotations

from sqlalchemy import Integer, MetaData, inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.schema import CreateTable

# tabela -> lista de definições "nome TIPO [restrições]"
_COLUMNS: dict[str, list[str]] = {
    "itens": ["buffs TEXT", "nerfs TEXT", "quantity INTEGER NOT NULL DEFAULT 1"],
    "racas": ["image TEXT"],
    "characters": [
        "current_map_id INTEGER",
        "portrait TEXT",
        "hp INTEGER",
        "max_hp INTEGER",
        "mana INTEGER",
        "max_mana INTEGER",
        "buffs TEXT",
        "debuffs TEXT",
        "visibility TEXT",
    ],
    "maps": ["region_id INTEGER", "country_id INTEGER", "village_id INTEGER", "parent_map_id INTEGER"],
    "fights": [
        "started_at TIMESTAMP",
        "ended_at TIMESTAMP",
        "status TEXT NOT NULL DEFAULT 'in_progress'",
        "duration_seconds INTEGER NOT NULL DEFAULT 0",
        "total_player_damage INTEGER NOT NULL DEFAULT 0",
        "total_enemy_damage INTEGER NOT NULL DEFAULT 0",
        "total_player_healing INTEGER NOT NULL DEFAULT 0",
        "total_enemy_healing INTEGER NOT NULL DEFAULT 0",
        "player_damage_count INTEGER NOT NULL DEFAULT 0",
        "enemy_damage_count INTEGER NOT NULL DEFAULT 0",
        "player_healing_count INTEGER NOT NULL DEFAULT 0",
        "enemy_healing_count INTEGER NOT NULL DEFAULT 0",
    ],
    "fight_entries": [
        "actor_type TEXT NOT NULL DEFAULT 'player'",
        "actor_name TEXT NOT NULL DEFAULT ''",
        "damage INTEGER NOT NULL DEFAULT 0",
        "healing INTEGER NOT NULL DEFAULT 0",
        "action TEXT",
        "value INTEGER NOT NULL DEFAULT 0",
        "card_id INTEGER",
        "created_at TIMESTAMP",
    ],
}


def _integer_columns_with_wrong_type(engine: Engine, metadata: MetaData) -> dict[str, list[str]]:
    """Colunas inteiras no modelo que o banco antigo criou como texto (ex.: characters.user_id VARCHAR)."""
    inspector = inspect(engine)
    existing = set(inspector.get_table_names())
    wrong: dict[str, list[str]] = {}
    for table in metadata.sorted_tables:
        if table.name not in existing:
            continue
        declared = {col["name"]: str(col["type"]).upper() for col in inspector.get_columns(table.name)}
        for column in table.columns:
            if isinstance(column.type, Integer) and column.name in declared and "INT" not in declared[column.name]:
                wrong.setdefault(table.name, []).append(column.name)
    return wrong


def _rebuild_sqlite_table(engine: Engine, metadata: MetaData, table_name: str, integer_columns: list[str]) -> None:
    """Recria a tabela com os tipos do modelo, copiando os dados (procedimento recomendado pelo SQLite).

    Com texto em colunas inteiras, o Python recebe '4' em vez de 4 e checagens
    como `character.user_id == user.id` falham.
    """
    table = metadata.tables[table_name]
    old_columns = {col["name"] for col in inspect(engine).get_columns(table_name)}
    shared = [col.name for col in table.columns if col.name in old_columns]
    select_list = ", ".join(f"CAST({name} AS INTEGER)" if name in integer_columns else name for name in shared)
    column_list = ", ".join(shared)
    temp_name = f"_rebuild_{table_name}"

    with engine.connect() as connection:
        # Fora de transação: o PRAGMA não tem efeito dentro de uma.
        connection.exec_driver_sql("PRAGMA foreign_keys=OFF")
        connection.commit()
        try:
            with connection.begin():
                connection.exec_driver_sql(f"DROP TABLE IF EXISTS {temp_name}")
                # DDL da tabela do modelo com outro nome. CreateTable não inclui os índices,
                # que colidiriam com os da tabela antiga; eles são recriados depois.
                ddl = str(CreateTable(table).compile(dialect=engine.dialect)).strip()
                connection.exec_driver_sql(ddl.replace(f"CREATE TABLE {table_name} ", f"CREATE TABLE {temp_name} ", 1))
                connection.exec_driver_sql(f"INSERT INTO {temp_name} ({column_list}) SELECT {select_list} FROM {table_name}")
                connection.exec_driver_sql(f"DROP TABLE {table_name}")
                connection.exec_driver_sql(f"ALTER TABLE {temp_name} RENAME TO {table_name}")
                for index in table.indexes:
                    index.create(connection, checkfirst=True)
        finally:
            connection.exec_driver_sql("PRAGMA foreign_keys=ON")
            connection.commit()


def ensure_schema_updates(engine: Engine, metadata: MetaData | None = None) -> list[str]:
    """Adiciona colunas que faltam e corrige tipos legados. Devolve o que foi alterado."""
    changes: list[str] = []
    if metadata is not None and engine.dialect.name == "sqlite":
        for table_name, columns in _integer_columns_with_wrong_type(engine, metadata).items():
            _rebuild_sqlite_table(engine, metadata, table_name, columns)
            changes.extend(f"{table_name}.{name} -> INTEGER" for name in columns)

    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    added = changes

    with engine.begin() as connection:
        for table, columns in _COLUMNS.items():
            if table not in existing_tables:
                continue
            present = {col["name"] for col in inspector.get_columns(table)}
            for column_sql in columns:
                name = column_sql.split()[0]
                if name not in present:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column_sql}"))
                    added.append(f"{table}.{name}")
    return added

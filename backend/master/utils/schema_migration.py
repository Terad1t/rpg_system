"""Ajustes de schema para bancos criados por versões antigas do sistema.

`Base.metadata.create_all` cria tabelas que faltam, mas não adiciona colunas
novas em tabelas existentes. Esta função adiciona as colunas que versões
anteriores não tinham. Usa o inspector do SQLAlchemy, então não depende de SQLite.
"""

from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

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


def ensure_schema_updates(engine: Engine) -> list[str]:
    """Adiciona colunas que faltam. Devolve a lista `tabela.coluna` adicionada."""
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    added: list[str] = []

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

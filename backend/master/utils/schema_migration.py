from __future__ import annotations

import sqlite3
from pathlib import Path

from ..database.connection import engine


def _database_path() -> Path:
    database = engine.url.database
    if not database:
        raise RuntimeError("SQLite database path is not configured")

    path = Path(database)
    if not path.is_absolute():
        path = Path.cwd() / path
    return path


def _table_columns(connection: sqlite3.Connection, table_name: str) -> set[str]:
    cursor = connection.execute(f"PRAGMA table_info({table_name})")
    return {row[1] for row in cursor.fetchall()}


def _ensure_column(connection: sqlite3.Connection, table_name: str, column_sql: str) -> None:
    column_name = column_sql.split()[0]
    if column_name not in _table_columns(connection, table_name):
        connection.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_sql}")


def ensure_schema_updates() -> None:
    database_path = _database_path()
    if not database_path.exists():
        return

    with sqlite3.connect(database_path) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS master_audit (
                id INTEGER PRIMARY KEY,
                master_id INTEGER NOT NULL,
                character_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                payload TEXT,
                created_at DATETIME
            )
            """
        )
        _ensure_column(connection, "itens", "buffs TEXT")
        _ensure_column(connection, "itens", "nerfs TEXT")
        _ensure_column(connection, "itens", "quantity INTEGER NOT NULL DEFAULT 1")
        _ensure_column(connection, "racas", "image TEXT")
        _ensure_column(connection, "characters", "current_map_id INTEGER")
        _ensure_column(connection, "characters", "portrait TEXT")
        _ensure_column(connection, "characters", "hp INTEGER")
        _ensure_column(connection, "characters", "max_hp INTEGER")
        _ensure_column(connection, "characters", "mana INTEGER")
        _ensure_column(connection, "characters", "max_mana INTEGER")
        _ensure_column(connection, "characters", "buffs TEXT")
        _ensure_column(connection, "characters", "debuffs TEXT")
        _ensure_column(connection, "characters", "visibility TEXT")
        _ensure_column(connection, "maps", "region_id INTEGER")
        _ensure_column(connection, "maps", "country_id INTEGER")
        _ensure_column(connection, "maps", "village_id INTEGER")
        _ensure_column(connection, "maps", "parent_map_id INTEGER")
        _ensure_column(connection, "fights", "started_at DATETIME")
        _ensure_column(connection, "fights", "ended_at DATETIME")
        _ensure_column(connection, "fights", "status TEXT NOT NULL DEFAULT 'in_progress'")
        _ensure_column(connection, "fights", "duration_seconds INTEGER NOT NULL DEFAULT 0")
        _ensure_column(connection, "fights", "total_player_damage INTEGER NOT NULL DEFAULT 0")
        _ensure_column(connection, "fights", "total_enemy_damage INTEGER NOT NULL DEFAULT 0")
        _ensure_column(connection, "fights", "total_player_healing INTEGER NOT NULL DEFAULT 0")
        _ensure_column(connection, "fights", "total_enemy_healing INTEGER NOT NULL DEFAULT 0")
        _ensure_column(connection, "fights", "player_damage_count INTEGER NOT NULL DEFAULT 0")
        _ensure_column(connection, "fights", "enemy_damage_count INTEGER NOT NULL DEFAULT 0")
        _ensure_column(connection, "fights", "player_healing_count INTEGER NOT NULL DEFAULT 0")
        _ensure_column(connection, "fights", "enemy_healing_count INTEGER NOT NULL DEFAULT 0")
        _ensure_column(connection, "fight_entries", "actor_type TEXT NOT NULL")
        _ensure_column(connection, "fight_entries", "actor_name TEXT NOT NULL")
        _ensure_column(connection, "fight_entries", "damage INTEGER NOT NULL DEFAULT 0")
        _ensure_column(connection, "fight_entries", "healing INTEGER NOT NULL DEFAULT 0")
        _ensure_column(connection, "fight_entries", "created_at DATETIME")
        connection.commit()
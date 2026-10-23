from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

from ..core.config import get_settings

DATABASE_URL = get_settings().database_url

_is_sqlite = DATABASE_URL.startswith("sqlite")
_is_memory = _is_sqlite and (DATABASE_URL in ("sqlite://", "sqlite:///:memory:"))

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    pool_pre_ping=not _is_sqlite,
    # Banco em memória (testes): uma única conexão compartilhada, senão cada sessão veria um banco vazio.
    **({"poolclass": StaticPool} if _is_memory else {}),
)

if _is_sqlite:

    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, _record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

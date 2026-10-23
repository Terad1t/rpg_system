import os
import tempfile
from pathlib import Path

# Configuração precisa existir antes de importar a aplicação.
_TMP = Path(tempfile.mkdtemp(prefix="rpg_test_"))
os.environ["SECRET_KEY"] = "test-secret-key-with-enough-length-1234567890"
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["STATIC_DIR"] = str(_TMP / "static")
os.environ["MASTER_BOOTSTRAP_TOKEN"] = "bootstrap-test-token"
os.environ["EFFECTS_INTERVAL_SECONDS"] = "3600"
os.environ["MAX_UPLOAD_BYTES"] = str(64 * 1024)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from backend.master.controllers.auth_controller import login_limiter  # noqa: E402
from backend.master.database.connection import Base, SessionLocal, engine  # noqa: E402
from backend.master.main import app  # noqa: E402
from backend.master.models import Character, Classe, Raca, User  # noqa: E402
from backend.master.utils.auth_utils import create_access_token, hash_password, hash_pin  # noqa: E402

PASSWORD = "secret123"
PIN = "1234"


@pytest.fixture(autouse=True)
def _fresh_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    login_limiter.reset()
    yield


@pytest.fixture()
def db():
    with SessionLocal() as session:
        yield session


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def make_user(db):
    def _make(login: str, role: str = "player", is_active: bool = True) -> User:
        user = User(
            login=login,
            password_hash=hash_password(PASSWORD),
            pin_hash=hash_pin(PIN),
            role=role,
            is_active=is_active,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    return _make


def auth_header(user: User) -> dict:
    return {"Authorization": f"Bearer {create_access_token(user.id, user.role)}"}


@pytest.fixture()
def master(make_user):
    return make_user("mestre", role="master")


@pytest.fixture()
def player(make_user):
    return make_user("jogador1")


@pytest.fixture()
def other_player(make_user):
    return make_user("jogador2")


@pytest.fixture()
def make_character(db):
    def _make(owner: User | None, name: str = "Aria", tipo: str = "player", **fields) -> Character:
        raca = db.query(Raca).first() or Raca(name="Humano")
        classe = db.query(Classe).first() or Classe(name="Guerreiro")
        db.add_all([raca, classe])
        db.flush()
        character = Character(
            name=name,
            tipo=tipo,
            raca_id=raca.id,
            classe_id=classe.id,
            user_id=owner.id if owner else None,
            hp=fields.pop("hp", 10),
            max_hp=fields.pop("max_hp", 10),
            **fields,
        )
        db.add(character)
        db.commit()
        db.refresh(character)
        return character

    return _make

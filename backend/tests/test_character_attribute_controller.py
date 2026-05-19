import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.master.database import connection as conn
from backend.master.main import app
from backend.master.models import Character, CharacterAttribute
# ensure model modules are loaded so metadata includes all tables
from backend.master.models import character_attribute_model, attribute_distribution_log_model
from backend.master.utils.auth_dependencies import CurrentUser, get_current_player
from backend.master.database.connection import get_db


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    conn.Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    # override get_db
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def fake_current_player():
        cu = CurrentUser()
        cu.user_id = 1
        cu.role = "player"
        return cu

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_player] = fake_current_player

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


def test_get_attributes_endpoint(client, db_session):
    # prepare data
    char = Character(name="Ctrl", tipo="player", raca_id=1, classe_id=1, user_id=1, free_points=5)
    db_session.add(char)
    db_session.commit()
    attr = CharacterAttribute(character_id=char.id, attribute_name="strength", base_value=4, distributed_points=0)
    db_session.add(attr)
    db_session.commit()

    resp = client.get(f"/api/characters/{char.id}/attributes")
    assert resp.status_code == 200
    data = resp.json()
    assert data["free_points"] == 5
    assert any(a["attribute_name"] == "strength" for a in data["attributes"])


def test_distribute_points_endpoint(client, db_session):
    char = Character(name="Ctrl2", tipo="player", raca_id=1, classe_id=1, user_id=1, free_points=5, total_points_distributed=0)
    db_session.add(char)
    db_session.commit()
    attr = CharacterAttribute(character_id=char.id, attribute_name="strength", base_value=4, distributed_points=0)
    db_session.add(attr)
    db_session.commit()

    payload = {"attribute_name": "strength", "points_to_add": 2}
    resp = client.post(f"/api/characters/{char.id}/distribute-points", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["free_points"] == 3
    assert any(a["attribute_name"] == "strength" and a["distributed_points"] == 2 for a in data["attributes"])

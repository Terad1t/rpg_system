import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.master.database import connection as conn
from backend.master.models import (
    Character,
    CharacterAttribute,
    AttributeDistributionLog,
)
from backend.master.services.character_attribute_service import (
    initialize_character_attributes,
    distribute_points,
)


@pytest.fixture()
def db_session():
    # in-memory SQLite for tests
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    conn.Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


def test_initialize_and_distribute(db_session):
    # create a character
    char = Character(name="Test", tipo="player", raca_id=1, classe_id=1, user_id=1, free_points=10, total_points_distributed=0)
    db_session.add(char)
    db_session.commit()

    base_attrs = {"strength": 5, "intelligence": 3}
    initialize_character_attributes(db_session, char.id, base_attrs, investigation_value=2)

    attrs = db_session.query(CharacterAttribute).filter(CharacterAttribute.character_id == char.id).all()
    names = {a.attribute_name for a in attrs}
    assert "strength" in names
    assert "intelligence" in names
    assert "investigation" in names

    # distribute 3 points to strength
    updated = distribute_points(db_session, char.id, user_id=1, attribute_name="strength", points_to_add=3)
    assert updated.distributed_points == 3

    db_char = db_session.query(Character).filter(Character.id == char.id).first()
    assert db_char.free_points == 7
    assert db_char.total_points_distributed == 3


def test_distribute_errors(db_session):
    # create character and attribute
    char = Character(name="Err", tipo="player", raca_id=1, classe_id=1, user_id=2, free_points=1, total_points_distributed=0)
    db_session.add(char)
    db_session.commit()

    # no attributes initialized => should raise
    with pytest.raises(ValueError):
        distribute_points(db_session, char.id, user_id=2, attribute_name="strength", points_to_add=1)

    # initialize
    initialize_character_attributes(db_session, char.id, {"strength": 2}, investigation_value=0)

    # try to add more points than free_points
    with pytest.raises(ValueError):
        distribute_points(db_session, char.id, user_id=2, attribute_name="strength", points_to_add=5)

    # invalid attribute
    with pytest.raises(ValueError):
        distribute_points(db_session, char.id, user_id=2, attribute_name="unknown_attr", points_to_add=1)

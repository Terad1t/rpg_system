import pytest

from backend.master.models import Character, CharacterAttribute, CharacterRequest, Classe, Raca
from backend.master.services.character_attribute_service import distribute_points, initialize_character_attributes

from .conftest import auth_header

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


# ========== UPLOAD DE RETRATO ==========


def test_portrait_upload_accepts_png_and_generates_name(client, player, make_character):
    character = make_character(player)
    response = client.post(
        f"/api/my-characters/{character.id}/portrait",
        files={"file": ("../../evil name.png", PNG, "image/png")},
        headers=auth_header(player),
    )
    assert response.status_code == 200
    url = response.json()["portrait"]
    assert url.startswith("/static/uploads/portraits/char_")
    assert url.endswith(".png")
    assert "evil" not in url

    served = client.get(url)
    assert served.status_code == 200
    assert served.content == PNG


@pytest.mark.parametrize(
    ("filename", "content"),
    [
        ("xss.html", b"<script>alert(1)</script>"),
        ("fake.png", b"<html>not really a png</html>"),
    ],
)
def test_portrait_upload_rejects_non_images(client, player, make_character, filename, content):
    character = make_character(player)
    response = client.post(
        f"/api/my-characters/{character.id}/portrait",
        files={"file": (filename, content, "image/png")},
        headers=auth_header(player),
    )
    assert response.status_code == 415


def test_portrait_upload_rejects_large_files(client, player, make_character):
    character = make_character(player)
    big = PNG + b"\x00" * (65 * 1024)
    response = client.post(
        f"/api/my-characters/{character.id}/portrait",
        files={"file": ("big.png", big, "image/png")},
        headers=auth_header(player),
    )
    assert response.status_code == 413


def test_portrait_upload_on_foreign_character_is_forbidden(client, player, other_player, make_character):
    character = make_character(other_player)
    response = client.post(
        f"/api/my-characters/{character.id}/portrait",
        files={"file": ("a.png", PNG, "image/png")},
        headers=auth_header(player),
    )
    assert response.status_code == 403


def test_player_cannot_set_script_url_as_portrait(client, player, make_character):
    character = make_character(player)
    response = client.put(
        f"/api/my-characters/{character.id}", json={"portrait": "javascript:alert(1)"}, headers=auth_header(player)
    )
    assert response.status_code == 422


def test_my_characters_returns_empty_list(client, player):
    response = client.get("/api/my-characters/", headers=auth_header(player))
    assert response.status_code == 200
    assert response.json() == []


# ========== ATRIBUTOS ==========


def test_initialize_and_distribute_points(db, player, make_character):
    character = make_character(player, free_points=10, total_points_distributed=0)
    initialize_character_attributes(db, character.id, {"strength": 5, "intellect": 3}, investigation_value=2)
    db.commit()

    names = {a.attribute_name for a in db.query(CharacterAttribute).filter_by(character_id=character.id)}
    assert names == {"strength", "intellect", "investigation"}

    updated = distribute_points(db, character.id, user_id=player.id, attribute_name="strength", points_to_add=3)
    assert updated.distributed_points == 3
    db.refresh(character)
    assert character.free_points == 7
    assert character.total_points_distributed == 3


@pytest.mark.parametrize(
    ("attribute", "points", "message"),
    [
        ("strength", 5, "Not enough free points"),
        ("unknown", 1, "Invalid attribute"),
        ("agility", 1, "Attribute not found"),
        ("strength", 0, "points_to_add must be positive"),
    ],
)
def test_distribute_points_errors(db, player, make_character, attribute, points, message):
    character = make_character(player, free_points=1)
    initialize_character_attributes(db, character.id, {"strength": 2})
    db.commit()
    with pytest.raises(ValueError, match=message):
        distribute_points(db, character.id, user_id=player.id, attribute_name=attribute, points_to_add=points)


def test_distribute_points_endpoint_checks_owner(client, db, player, other_player, make_character):
    character = make_character(player, free_points=2)
    initialize_character_attributes(db, character.id, {"strength": 1})
    db.commit()

    url = f"/api/characters/{character.id}/distribute-points"
    payload = {"attribute_name": "strength", "points_to_add": 1}
    assert client.post(url, json=payload, headers=auth_header(other_player)).status_code == 403

    ok = client.post(url, json=payload, headers=auth_header(player))
    assert ok.status_code == 200
    assert ok.json()["free_points"] == 1


def test_master_can_read_attributes(client, db, master, player, make_character):
    character = make_character(player)
    initialize_character_attributes(db, character.id, {"vigor": 4})
    db.commit()
    response = client.get(f"/api/characters/{character.id}/attributes", headers=auth_header(master))
    assert response.status_code == 200
    assert {a["attribute_name"] for a in response.json()["attributes"]} == {"vigor", "investigation"}


def test_player_panel_includes_attribute_totals(client, db, player, make_character):
    character = make_character(player)
    initialize_character_attributes(db, character.id, {"vigor": 4})
    db.commit()
    panel = client.get("/api/player-panel/", headers=auth_header(player)).json()
    assert panel["characters"][0]["attributes"]["vigor"] == 4


# ========== SOLICITAÇÃO E APROVAÇÃO ==========


def test_request_and_approval_creates_character_with_attributes(client, db, master, player):
    raca, classe = Raca(name="Elfo"), Classe(name="Mago")
    db.add_all([raca, classe])
    db.commit()

    created = client.post(
        "/api/characters/requests/",
        json={"name": "Lyra", "codename": "Coruja", "raca_id": raca.id, "classe_id": classe.id},
        headers=auth_header(player),
    )
    assert created.status_code == 201
    request_id = created.json()["id"]

    approved = client.post(
        f"/api/characters/requests/{request_id}/approve",
        json={"hp": 30, "intellect": 7, "investigation": "advanced"},
        headers=auth_header(master),
    )
    assert approved.status_code == 200
    body = approved.json()
    assert body["user_id"] == player.id
    assert body["max_hp"] == 30

    attrs = {a.attribute_name: a.base_value for a in db.query(CharacterAttribute).filter_by(character_id=body["id"])}
    assert attrs["intellect"] == 7
    assert attrs["investigation"] == 2
    assert db.get(CharacterRequest, request_id).status == "approved"


def test_list_requests_filters_by_status(client, db, master, player):
    raca, classe = Raca(name="Elfo"), Classe(name="Mago")
    db.add_all([raca, classe])
    db.commit()
    client.post(
        "/api/characters/requests/",
        json={"name": "Lyra", "raca_id": raca.id, "classe_id": classe.id},
        headers=auth_header(player),
    )
    pending = client.get("/api/characters/requests/?status=pending", headers=auth_header(master)).json()
    approved = client.get("/api/characters/requests/?status=approved", headers=auth_header(master)).json()
    assert len(pending) == 1
    assert approved == []


# ========== MASTER ==========


def test_master_creates_character_and_broadcast_does_not_crash(client, db, master, player):
    raca, classe = Raca(name="Anão"), Classe(name="Guerreiro")
    db.add_all([raca, classe])
    db.commit()
    response = client.post(
        "/api/characters/",
        json={"name": "Borin", "tipo": "player", "raca_id": raca.id, "classe_id": classe.id, "user_id": player.id},
        headers=auth_header(master),
    )
    assert response.status_code == 201
    assert db.query(Character).count() == 1


def test_quick_update_applies_damage_and_rejects_unknown_fields(client, master, player, make_character):
    character = make_character(player, hp=10)
    url = f"/api/master/characters/{character.id}/apply"
    assert client.post(url, json={"hp": -4, "add_buff": "Escudo"}, headers=auth_header(master)).status_code == 200
    assert client.post(url, json={"set_hp": 999}, headers=auth_header(master)).status_code == 422

    summary = next(
        c for c in client.get("/api/master/characters/", headers=auth_header(master)).json() if c["id"] == character.id
    )
    assert summary["hp"] == 6
    assert "Escudo" in summary["buffs"]


def test_deleting_race_in_use_returns_conflict(client, master, player, make_character):
    character = make_character(player)
    response = client.delete(f"/api/racas/{character.raca_id}", headers=auth_header(master))
    assert response.status_code == 409


def test_inventory_includes_item_details(client, master, player, make_character, db):
    from backend.master.models import Item

    character = make_character(player)
    item = Item(name="Poção", tipo="consumivel")
    db.add(item)
    db.commit()

    added = client.post(
        f"/api/characters/{character.id}/inventory/add",
        params={"item_id": item.id, "quantity": 2},
        headers=auth_header(master),
    )
    assert added.status_code == 200

    inventory = client.get(f"/api/characters/{character.id}/inventory/", headers=auth_header(player)).json()
    assert inventory[0]["item"]["name"] == "Poção"
    assert inventory[0]["quantidade"] == 2


def test_master_overview_counts_real_records(client, master, player, other_player, make_character):
    make_character(player)
    overview = client.get("/api/master/overview/", headers=auth_header(master)).json()
    assert overview["players"] == 2
    assert overview["characters"] == 1
    assert overview["items"] == 0

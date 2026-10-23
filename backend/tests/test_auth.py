from backend.master.models import User

from .conftest import PASSWORD, PIN, auth_header


def _login(client, login, password=PASSWORD, pin=PIN):
    return client.post("/api/auth/login", json={"login": login, "password": password, "pin": pin})


def test_login_returns_token_and_profile(client, player):
    response = _login(client, "jogador1")
    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "player"
    assert body["login"] == "jogador1"

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.status_code == 200
    assert "password_hash" not in me.json()


def test_login_rejects_wrong_pin_and_unknown_user(client, player):
    assert _login(client, "jogador1", pin="9999").status_code == 401
    assert _login(client, "ninguem").status_code == 401


def test_login_is_rate_limited(client, player):
    for _ in range(5):
        assert _login(client, "jogador1", password="errada1").status_code == 401
    blocked = _login(client, "jogador1")
    assert blocked.status_code == 429
    assert int(blocked.headers["Retry-After"]) > 0


def test_inactive_user_cannot_login(client, make_user):
    make_user("inativo", is_active=False)
    assert _login(client, "inativo").status_code == 401


def test_token_stops_working_after_deactivation(client, db, master, player):
    headers = auth_header(player)
    assert client.get("/api/auth/me", headers=headers).status_code == 200

    assert client.post(f"/api/auth/users/{player.id}/deactivate", headers=auth_header(master)).status_code == 200
    assert client.get("/api/auth/me", headers=headers).status_code == 401


def test_role_comes_from_database_not_token(client, db, make_user):
    """Um token emitido quando o usuário era master não vale depois que ele é rebaixado."""
    user = make_user("ex_mestre", role="master")
    stale_token = auth_header(user)
    assert client.get("/api/auth/users", headers=stale_token).status_code == 200

    db.query(User).filter(User.id == user.id).update({"role": "player"})
    db.commit()
    assert client.get("/api/auth/users", headers=stale_token).status_code == 403


def test_master_cannot_delete_or_deactivate_self(client, master):
    headers = auth_header(master)
    assert client.delete(f"/api/auth/users/{master.id}", headers=headers).status_code == 400
    assert client.post(f"/api/auth/users/{master.id}/deactivate", headers=headers).status_code == 400


def test_master_creates_player_and_duplicate_login_fails(client, master):
    headers = auth_header(master)
    payload = {"login": "novato", "password": "senha123", "pin": "4321", "role": "player"}
    assert client.post("/api/auth/users", json=payload, headers=headers).status_code == 201
    assert client.post("/api/auth/users", json=payload, headers=headers).status_code == 400
    assert _login(client, "novato", password="senha123", pin="4321").status_code == 200


def test_only_one_master_allowed(client, master):
    payload = {"login": "outro_mestre", "password": "senha123", "pin": "4321", "role": "master"}
    assert client.post("/api/auth/users", json=payload, headers=auth_header(master)).status_code == 400


def test_initialize_master_requires_bootstrap_token(client):
    payload = {"login": "mestre", "password": "senha123", "pin": "1234"}
    assert client.post("/api/auth/initialize-master", json=payload, headers={"X-Master-Bootstrap-Token": "x"}).status_code == 403

    ok = client.post("/api/auth/initialize-master", json=payload, headers={"X-Master-Bootstrap-Token": "bootstrap-test-token"})
    assert ok.status_code == 201

    again = client.post("/api/auth/initialize-master", json=payload, headers={"X-Master-Bootstrap-Token": "bootstrap-test-token"})
    assert again.status_code == 400

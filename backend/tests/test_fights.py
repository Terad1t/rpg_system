from datetime import timedelta

from backend.master.core.time import utcnow
from backend.master.models import FightEntry, FightInvite

from .conftest import auth_header


def _create_fight(client, master, name="Emboscada"):
    response = client.post("/api/fights/", json={"name": name, "status": "paused"}, headers=auth_header(master))
    assert response.status_code == 201
    return response.json()["id"]


def _invite(client, master, fight_id, *users):
    response = client.post(
        f"/api/fights/{fight_id}/invite",
        json={"user_ids": [u.id for u in users], "expires_in": 60},
        headers=auth_header(master),
    )
    assert response.status_code == 200
    return response


def test_respond_uses_token_user_not_body(client, master, player, other_player):
    fight_id = _create_fight(client, master)
    _invite(client, master, fight_id, player, other_player)

    # Mesmo mandando o id de outro jogador no corpo, a resposta vale para quem está logado.
    response = client.post(
        f"/api/fights/{fight_id}/respond",
        json={"accept": True, "user_id": other_player.id},
        headers=auth_header(player),
    )
    assert response.status_code == 200

    summary = client.get(f"/api/fights/{fight_id}/responses", headers=auth_header(master)).json()
    assert summary["accepted"] == [player.id]
    assert summary["pending"] == [other_player.id]


def test_respond_requires_pending_invite(client, master, player, other_player):
    fight_id = _create_fight(client, master)
    _invite(client, master, fight_id, player)

    not_invited = client.post(f"/api/fights/{fight_id}/respond", json={"accept": True}, headers=auth_header(other_player))
    assert not_invited.status_code == 404

    assert client.post(f"/api/fights/{fight_id}/respond", json={"accept": False}, headers=auth_header(player)).status_code == 200
    # Não dá para mudar de ideia depois de responder.
    again = client.post(f"/api/fights/{fight_id}/respond", json={"accept": True}, headers=auth_header(player))
    assert again.status_code == 404


def test_expired_invite_cannot_be_accepted(client, db, master, player):
    fight_id = _create_fight(client, master)
    _invite(client, master, fight_id, player)
    db.query(FightInvite).update({"expires_at": utcnow() - timedelta(seconds=1)})
    db.commit()

    response = client.post(f"/api/fights/{fight_id}/respond", json={"accept": True}, headers=auth_header(player))
    assert response.status_code == 404


def _start_with(client, master, *players):
    fight_id = _create_fight(client, master)
    _invite(client, master, fight_id, *players)
    for p in players:
        client.post(f"/api/fights/{fight_id}/respond", json={"accept": True}, headers=auth_header(p))
    started = client.put(f"/api/fights/{fight_id}/start", headers=auth_header(master))
    assert started.status_code == 200
    return fight_id


def test_turn_is_checked_before_saving_the_action(client, db, master, player, other_player):
    fight_id = _start_with(client, master, player, other_player)

    turn = client.get(f"/api/fights/{fight_id}/turn/me", headers=auth_header(player)).json()
    assert turn["is_my_turn"] is True

    blocked = client.post(
        f"/api/fights/{fight_id}/entries/player", json={"action": "attack", "value": 5}, headers=auth_header(other_player)
    )
    assert blocked.status_code == 403
    assert db.query(FightEntry).count() == 0

    ok = client.post(f"/api/fights/{fight_id}/entries/player", json={"action": "attack", "value": 5}, headers=auth_header(player))
    assert ok.status_code == 201

    fight = client.get(f"/api/fights/{fight_id}", headers=auth_header(master)).json()
    assert fight["total_player_damage"] == 5


def test_advance_turn_rotates_participants(client, master, player, other_player):
    fight_id = _start_with(client, master, player, other_player)
    advanced = client.post(f"/api/fights/{fight_id}/turn/advance", headers=auth_header(master)).json()
    assert advanced["current_user_id"] == other_player.id


def test_invalid_action_is_rejected(client, master, player):
    fight_id = _start_with(client, master, player)
    response = client.post(f"/api/fights/{fight_id}/entries/player", json={"action": "nuke"}, headers=auth_header(player))
    assert response.status_code == 422


def test_player_cannot_act_with_someone_elses_character(client, master, player, other_player, make_character):
    fight_id = _start_with(client, master, player)
    foreign = make_character(other_player)
    response = client.post(
        f"/api/fights/{fight_id}/entries/player",
        json={"action": "attack", "value": 3, "actor_character_id": foreign.id},
        headers=auth_header(player),
    )
    assert response.status_code == 403


def test_participant_reads_fight_but_outsider_does_not(client, master, player, other_player):
    fight_id = _start_with(client, master, player)
    assert client.get(f"/api/fights/{fight_id}", headers=auth_header(player)).status_code == 200
    assert client.get(f"/api/fights/{fight_id}/responses", headers=auth_header(player)).status_code == 200
    assert client.get(f"/api/fights/{fight_id}", headers=auth_header(other_player)).status_code == 403


def test_start_unknown_fight_returns_404(client, master):
    assert client.put("/api/fights/999/start", headers=auth_header(master)).status_code == 404

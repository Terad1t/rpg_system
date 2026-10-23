import pytest
from starlette.websockets import WebSocketDisconnect

from backend.master.utils.auth_utils import create_access_token


def _token(user):
    return create_access_token(user.id, user.role)


def test_character_view_only_for_owner_or_master(client, master, player, other_player, make_character):
    character = make_character(player)

    with client.websocket_connect(f"/ws/character-view/{character.id}?token={_token(player)}"):
        pass
    with client.websocket_connect(f"/ws/character-view/{character.id}?token={_token(master)}"):
        pass
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect(f"/ws/character-view/{character.id}?token={_token(other_player)}") as ws:
            ws.receive_text()
    assert exc.value.code == 1008


def test_user_updates_channel_is_private(client, player, other_player):
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f"/ws/user-updates/{other_player.id}?token={_token(player)}") as ws:
            ws.receive_text()


def test_websocket_rejects_invalid_token(client, player):
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f"/ws/user-updates/{player.id}?token=invalido") as ws:
            ws.receive_text()


def test_chat_broadcasts_and_persists_messages(client, player):
    with client.websocket_connect(f"/api/chat/ws?token={_token(player)}") as ws:
        joined = ws.receive_json()
        assert joined["message_type"] == "user_joined"

        ws.send_json({"message": "<b>Olá</b> mesa"})
        message = ws.receive_json()
        assert message["message_type"] == "message"
        # O texto vai como veio; quem exibe (React) é responsável por escapar.
        assert message["message"] == "<b>Olá</b> mesa"

        ws.send_text("isso não é json")
        assert ws.receive_json()["message_type"] == "error"

    history = client.get("/api/chat/history", headers={"Authorization": f"Bearer {_token(player)}"}).json()
    assert history["total"] == 1


def test_master_is_not_allowed_in_player_chat(client, master):
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f"/api/chat/ws?token={_token(master)}") as ws:
            ws.receive_text()

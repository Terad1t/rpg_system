#!/usr/bin/env python3
"""
Script rápido para criar dois players de teste via API usando o Master.
"""
import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

MASTER_CREDENTIALS = {
    "login": "master",
    "password": "master123",
    "pin": "1234",
}

PLAYERS = [
    {"login": "player1", "password": "senha123", "pin": "1234"},
    {"login": "player2", "password": "senha456", "pin": "1234"},
]


def login_master():
    try:
        r = requests.post(f"{BASE_URL}/auth/login", json=MASTER_CREDENTIALS, timeout=10)
    except Exception as e:
        print(f"❌ Erro ao conectar ao backend: {e}")
        return None

    if r.status_code != 200:
        print(f"❌ Falha no login do master: {r.status_code} {r.text}")
        return None

    return r.json().get("access_token")


def create_player(token, player):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "login": player["login"],
        "password": player["password"],
        "pin": player["pin"],
        "role": "player",
        "is_active": True,
    }
    try:
        r = requests.post(f"{BASE_URL}/auth/users", json=payload, headers=headers, timeout=10)
    except Exception as e:
        print(f"❌ Erro ao criar {player['login']}: {e}")
        return

    if r.status_code == 200:
        print(f"✅ Criado: {player['login']} (id={r.json().get('id')})")
    else:
        print(f"⚠️ Não foi possível criar {player['login']}: {r.status_code} - {r.text}")


if __name__ == '__main__':
    token = login_master()
    if not token:
        sys.exit(1)

    for p in PLAYERS:
        create_player(token, p)

    print("Concluído.")

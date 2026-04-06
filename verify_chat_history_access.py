#!/usr/bin/env python3
import requests

BASE_URL = "http://127.0.0.1:8000"

MASTER = {"login": "master", "password": "master123", "pin": "1234"}
PLAYER = {"login": "player1", "password": "senha123", "pin": "1234"}

print('1) GET /chat/history without auth')
r = requests.get(f"{BASE_URL}/chat/history")
print(r.status_code, r.text)

print('\n2) GET /chat/history with master token')
rm = requests.post(f"{BASE_URL}/auth/login", json=MASTER)
if rm.status_code != 200:
    print('master login failed', rm.status_code, rm.text)
else:
    token = rm.json().get('access_token')
    r2 = requests.get(f"{BASE_URL}/chat/history", headers={"Authorization": f"Bearer {token}"})
    print(r2.status_code, r2.text)

print('\n3) GET /chat/history with player token')
rp = requests.post(f"{BASE_URL}/auth/login", json=PLAYER)
if rp.status_code != 200:
    print('player login failed', rp.status_code, rp.text)
else:
    token = rp.json().get('access_token')
    r3 = requests.get(f"{BASE_URL}/chat/history", headers={"Authorization": f"Bearer {token}"})
    print(r3.status_code)
    try:
        print(r3.json())
    except Exception:
        print(r3.text)

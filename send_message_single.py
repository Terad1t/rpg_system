#!/usr/bin/env python3
import asyncio
import json
import requests
import websockets

BASE_URL = "http://127.0.0.1:8000"
WS_BASE = "ws://127.0.0.1:8000/chat/ws?token="

PLAYER = {"login": "player1", "password": "senha123", "pin": "1234"}

async def run():
    r = requests.post(f"{BASE_URL}/auth/login", json={"login": PLAYER['login'], "password": PLAYER['password'], "pin": PLAYER['pin']})
    if r.status_code != 200:
        print('login failed:', r.status_code, r.text)
        return
    token = r.json().get('access_token')
    print('token obtained')
    uri = f"{WS_BASE}{token}"
    try:
        async with websockets.connect(uri) as ws:
            print('connected')
            await asyncio.sleep(1)
            msg = 'ping from player1'
            print('sending', msg)
            await ws.send(json.dumps({'message': msg}))
            await asyncio.sleep(1)
    except Exception as e:
        print('websocket error:', e)

    # check history
    headers = {'Authorization': f'Bearer {token}'}
    r2 = requests.get(f"{BASE_URL}/chat/history", headers=headers)
    print('history status', r2.status_code)
    try:
        print(r2.json())
    except Exception:
        print(r2.text)

if __name__ == '__main__':
    asyncio.run(run())

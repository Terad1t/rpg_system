#!/usr/bin/env python3
import asyncio
import json
import requests
import websockets

BASE_URL = "http://127.0.0.1:8000"
WS_BASE = "ws://127.0.0.1:8000/chat/ws?token="

PLAYERS = [
    {"login": "player1", "password": "senha123", "pin": "1234"},
    {"login": "player2", "password": "senha456", "pin": "1234"},
]

messages_received = {"player1": [], "player2": []}

async def client(name, token, send_message=None):
    uri = f"{WS_BASE}{token}"
    try:
        async with websockets.connect(uri) as ws:
            print(f"{name}: connected to websocket")

            async def receiver():
                try:
                    async for raw in ws:
                        try:
                            data = json.loads(raw)
                        except Exception:
                            data = raw
                        print(f"{name} RECEIVED:", data)
                        messages_received[name].append(data)
                except Exception as e:
                    print(f"{name} receiver ended: {e}")

            recv_task = asyncio.create_task(receiver())

            # Wait for both clients to connect and receive history/system
            await asyncio.sleep(1.5)

            if send_message:
                print(f"{name}: sending -> {send_message}")
                await ws.send(json.dumps({"message": send_message}))

            # Wait for broadcasts to propagate
            await asyncio.sleep(2)

            try:
                await ws.close()
            except Exception:
                pass

            # cancel receiver task
            recv_task.cancel()
            try:
                await recv_task
            except Exception:
                pass

    except Exception as e:
        print(f"{name}: connection error -> {e}")


async def run_test():
    # Login players
    tokens = []
    for p in PLAYERS:
        r = requests.post(f"{BASE_URL}/auth/login", json={"login": p['login'], "password": p['password'], "pin": p['pin']})
        if r.status_code != 200:
            print(f"Login failed for {p['login']}: {r.status_code} {r.text}")
            return
        tokens.append(r.json().get("access_token"))

    # Run both clients concurrently: player1 sends, player2 listens
    await asyncio.gather(
        client("player1", tokens[0], send_message="Olá do player1"),
        client("player2", tokens[1], send_message=None),
    )

    # Check if player2 received player1's message
    found = False
    for msg in messages_received["player2"]:
        if isinstance(msg, dict) and msg.get("message") == "Olá do player1":
            found = True
            break

    if found:
        print("TEST OK: player2 received player1's message")
    else:
        print("TEST FAILED: player2 did not receive player1's message")

    print('\nSummary:')
    print('player1 messages:', messages_received['player1'])
    print('player2 messages:', messages_received['player2'])

if __name__ == '__main__':
    asyncio.run(run_test())

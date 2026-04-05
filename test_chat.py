#!/usr/bin/env python3
"""
Script para testar WebSocket Chat
"""

import asyncio
import websockets
import json
import requests

BASE_URL = "http://127.0.0.1:8000"
WS_URL = "ws://127.0.0.1:8000"

async def test_chat():
    # 1. Login como player1
    print("🔐 Login como player1...")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"login": "player1", "password": "senha1", "pin": "1234"}
    )
    
    if response.status_code != 200:
        print(f"❌ Erro ao fazer login: {response.json()}")
        return
    
    token = response.json()["access_token"]
    print(f"✅ Login realizado! Token: {token[:20]}...")
    
    # 2. Conectar ao WebSocket
    print("\n📡 Conectando ao WebSocket...")
    uri = f"{WS_URL}/ws?token={token}"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Conectado ao WebSocket!")
            
            # 3. Enviar mensagem
            print("\n💬 Enviando mensagem...")
            await websocket.send(json.dumps({
                "message": "Olá! Testando o chat!"
            }))
            print("✅ Mensagem enviada!")
            
            # 4. Receber mensagens
            print("\n📨 Aguardando mensagens (10 segundos)...\n")
            for i in range(20):
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=1)
                    data = json.loads(message)
                    print(f"📩 {data.get('username', 'Anônimo')}: {data.get('message', data)}")
                except asyncio.TimeoutError:
                    pass
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    asyncio.run(test_chat())

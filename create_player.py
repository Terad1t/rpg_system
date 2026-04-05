#!/usr/bin/env python3
"""
Script para criar Players no RPG System
Execute este script para adicionar novos players ao banco de dados
"""

import requests
import json
from getpass import getpass

BASE_URL = "http://127.0.0.1:8000"

def get_master_token():
    """Faz login como Master e retorna o token"""
    print("\n=== LOGIN COMO MASTER ===")
    login = "master"
    password = "master123"
    pin = "1234"
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"login": login, "password": password, "pin": pin}
    )
    
    if response.status_code != 200:
        print(f"❌ Erro ao fazer login: {response.json()}")
        return None
    
    token = response.json()["access_token"]
    print(f"✅ Login realizado com sucesso!")
    return token

def create_player(token, login, password, pin):
    """Cria um novo player"""
    headers = {"Authorization": f"Bearer {token}"}
    
    user_data = {
        "login": login,
        "password": password,
        "pin": pin,
        "role": "player",
        "is_active": True
    }
    
    response = requests.post(
        f"{BASE_URL}/auth/users",
        json=user_data,
        headers=headers
    )
    
    if response.status_code == 200:
        user = response.json()
        print(f"✅ Player criado com sucesso!")
        print(f"   Usuário: {user['login']}")
        print(f"   ID: {user['id']}")
        return user
    else:
        print(f"❌ Erro ao criar player: {response.json()}")
        return None

def main():
    print("\n" + "="*50)
    print("    CRIADOR DE PLAYERS - RPG SYSTEM")
    print("="*50)
    
    # Login como Master
    token = get_master_token()
    if not token:
        return
    
    while True:
        print("\n--- Novo Player ---")
        login = input("Nome de usuário: ").strip()
        if not login:
            print("❌ Nome de usuário não pode estar vazio!")
            continue
        
        password = input("Senha: ").strip()
        if len(password) < 6:
            print("❌ Senha deve ter no mínimo 6 caracteres!")
            continue
        
        pin = input("PIN (4-6 dígitos): ").strip()
        if not pin.isdigit() or len(pin) < 4 or len(pin) > 6:
            print("❌ PIN deve ter 4-6 dígitos!")
            continue
        
        # Criar player
        user = create_player(token, login, password, pin)
        if user:
            print(f"\n💾 Salve essas credenciais:")
            print(f"   Usuário: {login}")
            print(f"   Senha: {password}")
            print(f"   PIN: {pin}")
        
        # Perguntar se quer criar outro
        outro = input("\nDeseja criar outro player? (s/n): ").strip().lower()
        if outro != 's':
            break
    
    print("\n✅ Ferramenta encerrada!")

if __name__ == "__main__":
    main()

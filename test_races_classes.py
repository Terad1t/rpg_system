import requests
import json

BASE_URL = "http://localhost:8000"

# Test data
test_master = {
    "login": "master",
    "password": "master123",
    "pin": "1234"
}

test_race = {
    "name": "Humano",
    "description": "Raça versátil e adaptável"
}

test_class = {
    "name": "Guerreiro",
    "subclass": "Cavaleiro",
    "description": "Classe de combate corpo a corpo"
}

def test_api():
    print("=" * 50)
    print("TESTE DE ENDPOINTS DE RAÇAS E CLASSES")
    print("=" * 50)
    
    # 1. Initialize master
    print("\n1. Inicializando mestre...")
    response = requests.post(f"{BASE_URL}/auth/initialize-master", json=test_master)
    if response.status_code in [200, 201]:
        user_data = response.json()
        print(f"✓ Mestre inicializado com sucesso")
        print(f"  User ID: {user_data.get('id')}")
    else:
        print(f"⚠ Mestre pode já existir ({response.status_code})")
        if response.status_code == 400:
            print(f"  Info: {response.json().get('detail')}")
    
    # 2. Login
    print("\n2. Realizando login...")
    login_data = {
        "login": test_master["login"],
        "password": test_master["password"],
        "pin": test_master["pin"]
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code in [200, 201]:
        auth_data = response.json()
        token = auth_data.get('access_token')
        print(f"✓ Login realizado com sucesso")
        print(f"  Token: {token[:20]}...")
    else:
        print(f"✗ Erro ao fazer login: {response.status_code}")
        print(f"  Response: {response.text}")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Test GET races (public)
    print("\n2. Testando GET /racas (público)...")
    response = requests.get(f"{BASE_URL}/racas")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        races = response.json()
        print(f"   ✓ Raças encontradas: {len(races)}")
    else:
        print(f"   ✗ Erro: {response.text}")
    
    # 3. Test POST race (master only)
    print("\n3. Testando POST /racas (master only)...")
    response = requests.post(f"{BASE_URL}/racas", json=test_race, headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code in [200, 201]:
        race = response.json()
        race_id = race.get('id')
        print(f"   ✓ Raça criada com ID: {race_id}")
        print(f"   Data: {json.dumps(race, indent=2)}")
    else:
        print(f"   ✗ Erro: {response.text}")
        return
    
    # 4. Test POST class (master only)
    print("\n4. Testando POST /classes (master only)...")
    response = requests.post(f"{BASE_URL}/classes", json=test_class, headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code in [200, 201]:
        classe = response.json()
        class_id = classe.get('id')
        print(f"   ✓ Classe criada com ID: {class_id}")
        print(f"   Data: {json.dumps(classe, indent=2)}")
    else:
        print(f"   ✗ Erro: {response.text}")
        return
    
    # 5. Test GET classes (public)
    print("\n5. Testando GET /classes (público)...")
    response = requests.get(f"{BASE_URL}/classes")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        classes = response.json()
        print(f"   ✓ Classes encontradas: {len(classes)}")
    else:
        print(f"   ✗ Erro: {response.text}")
    
    # 6. Test PUT race (master only)
    print(f"\n6. Testando PUT /racas/{race_id} (master only)...")
    updated_race = {"name": "Humano Atualizado", "description": "Descrição atualizada"}
    response = requests.put(f"{BASE_URL}/racas/{race_id}", json=updated_race, headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        updated = response.json()
        print(f"   ✓ Raça atualizada")
        print(f"   Data: {json.dumps(updated, indent=2)}")
    else:
        print(f"   ✗ Erro: {response.text}")
    
    # 7. Test PUT class (master only)
    print(f"\n7. Testando PUT /classes/{class_id} (master only)...")
    updated_class = {"name": "Guerreiro Atualizado"}
    response = requests.put(f"{BASE_URL}/classes/{class_id}", json=updated_class, headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        updated = response.json()
        print(f"   ✓ Classe atualizada")
        print(f"   Data: {json.dumps(updated, indent=2)}")
    else:
        print(f"   ✗ Erro: {response.text}")
    
    # 8. Test without authentication (should fail)
    print("\n8. Testando POST /racas SEM autenticação (deve falhar)...")
    response = requests.post(f"{BASE_URL}/racas", json=test_race)
    print(f"   Status: {response.status_code}")
    if response.status_code in [401, 403]:
        print(f"   ✓ Corretamente rejeitado (não autenticado)")
    else:
        print(f"   ✗ Erro: Deveria ter falhado, mas retornou {response.status_code}")
    
    print("\n" + "=" * 50)
    print("TESTES CONCLUÍDOS")
    print("=" * 50)

if __name__ == "__main__":
    test_api()

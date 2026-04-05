# 📖 Exemplos Práticos de Uso

## 🔑 1. Fluxo Completo: Master + Player + Chat

### Passo 1: Master Faz Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "master",
    "password": "master123",
    "pin": "1234"
  }'
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 1,
  "role": "master"
}
```

### Passo 2: Master Cria um Player

```bash
curl -X POST http://localhost:8000/auth/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "login": "aragorn",
    "password": "super_seguro",
    "pin": "9876",
    "role": "player",
    "is_active": true
  }'
```

**Resposta:**
```json
{
  "id": 2,
  "login": "aragorn",
  "role": "player",
  "is_active": true,
  "created_by": 1,
  "created_at": "2026-04-05T10:00:00",
  "updated_at": "2026-04-05T10:00:00"
}
```

### Passo 3: Master Cria um Personagem para o Player

```bash
curl -X POST http://localhost:8000/characters/ \
  -H "Authorization: Bearer <TOKEN_MASTER>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aragorn",
    "age": 87,
    "tipo": "player",
    "raca_id": 1,
    "classe_id": 1,
    "user_id": "aragorn"
  }'
```

### Passo 4: Player Faz Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "aragorn",
    "password": "super_seguro",
    "pin": "9876"
  }'
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 2,
  "role": "player"
}
```

### Passo 5: Player Edita seu Personagem

```bash
curl -X PUT http://localhost:8000/my-characters/1 \
  -H "Authorization: Bearer <TOKEN_PLAYER>" \
  -H "Content-Type: application/json" \
  -d '{
    "codename": "O Montanhês",
    "description": "Rei dos Homens, herdeiro de Isildur"
  }'
```

### Passo 6: Player Conecta ao Chat

```javascript
// JavaScript no navegador
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const ws = new WebSocket(`ws://localhost:8000/chat/ws?token=${token}`);

ws.onopen = () => {
  console.log("Conectado!");
  ws.send(JSON.stringify({
    message: "Olá, sou Aragorn!"
  }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log(`${msg.username}: ${msg.message}`);
};
```

### Passo 7: Visualizar Histórico de Chat

```bash
curl http://localhost:8000/chat/history?limit=10
```

**Resposta:**
```json
{
  "messages": [
    {
      "id": 1,
      "user_id": 2,
      "username": "aragorn",
      "message": "Olá, sou Aragorn!",
      "created_at": "2026-04-05T10:30:00"
    }
  ],
  "total": 1
}
```

---

## 🗺️ 2. Criar Mapa do Mundo

### Criar Região

```bash
curl -X POST http://localhost:8000/regions/ \
  -H "Authorization: Bearer <TOKEN_MASTER>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Terra Média",
    "description": "O mundo de Tolkien",
    "climate": "Variado"
  }'
```

### Criar País

```bash
curl -X POST http://localhost:8000/countries/ \
  -H "Authorization: Bearer <TOKEN_MASTER>" \
  -H "Content-Type: application/json" \
  -d '{
    "region_id": 1,
    "name": "Gondor",
    "description": "Reino dos Homens",
    "image": "/images/gondor.png"
  }'
```

### Criar Vila

```bash
curl -X POST http://localhost:8000/villages/ \
  -H "Authorization: Bearer <TOKEN_MASTER>" \
  -H "Content-Type: application/json" \
  -d '{
    "country_id": 1,
    "name": "Minas Tirith",
    "description": "Capital de Gondor",
    "image": "/images/minas_tirith.png"
  }'
```

### Listar Países de uma Região

```bash
curl http://localhost:8000/countries/region/1
```

### Listar Vilas de um País

```bash
curl http://localhost:8000/villages/country/1
```

---

## 🎮 3. Criar Habilidades

### Habilidade de Classe

```bash
curl -X POST http://localhost:8000/habilidades/ \
  -H "Authorization: Bearer <TOKEN_MASTER>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ataque Focado",
    "tipo": "classe",
    "custo_vigor": 10,
    "dano_base": 25,
    "efeitos_atributos": "Aumenta precisão",
    "classe_id": 1
  }'
```

### Habilidade Racial

```bash
curl -X POST http://localhost:8000/habilidades/ \
  -H "Authorization: Bearer <TOKEN_MASTER>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Visão Noturna",
    "tipo": "raça",
    "custo_vigor": 0,
    "efeitos_atributos": "Enxerga no escuro",
    "raca_id": 1
  }'
```

### Habilidade de Item

```bash
curl -X POST http://localhost:8000/habilidades/ \
  -H "Authorization: Bearer <TOKEN_MASTER>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Corte de Anduril",
    "tipo": "item",
    "dano_base": 40,
    "efeitos_atributos": "Lâmina sagrada",
    "item_id": 1
  }'
```

---

## 📊 4. Gerenciar Usuários (Master)

### Listar Todos os Usuários

```bash
curl http://localhost:8000/auth/users \
  -H "Authorization: Bearer <TOKEN_MASTER>"
```

### Obter Usuário Específico

```bash
curl http://localhost:8000/auth/users/2 \
  -H "Authorization: Bearer <TOKEN_MASTER>"
```

### Atualizar Senha de um Player

```bash
curl -X PUT http://localhost:8000/auth/users/2 \
  -H "Authorization: Bearer <TOKEN_MASTER>" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "nova_senha_super_secreta",
    "pin": "1111"
  }'
```

### Ativar/Desativar Player

```bash
# Desativar
curl -X POST http://localhost:8000/auth/users/2/deactivate \
  -H "Authorization: Bearer <TOKEN_MASTER>"

# Reativar
curl -X PUT http://localhost:8000/auth/users/2 \
  -H "Authorization: Bearer <TOKEN_MASTER>" \
  -H "Content-Type: application/json" \
  -d '{"is_active": true}'
```

### Deletar Usuário

```bash
curl -X DELETE http://localhost:8000/auth/users/2 \
  -H "Authorization: Bearer <TOKEN_MASTER>"
```

---

## 🎯 5. Gerenciar Personagens (Master)

### Criar Personagem

```bash
curl -X POST http://localhost:8000/characters/ \
  -H "Authorization: Bearer <TOKEN_MASTER>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gandalf",
    "age": 2019,
    "tipo": "npc",
    "raca_id": 2,
    "classe_id": 3
  }'
```

### Listar Personagens

```bash
curl http://localhost:8000/characters/
```

### Atualizar Personagem

```bash
curl -X PUT http://localhost:8000/characters/1 \
  -H "Authorization: Bearer <TOKEN_MASTER>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gandalf o Cinzento",
    "age": 2019
  }'
```

### Deletar Personagem

```bash
curl -X DELETE http://localhost:8000/characters/1 \
  -H "Authorization: Bearer <TOKEN_MASTER>"
```

---

## 🚨 6. Teste de Segurança

### Master NÃO pode acessar chat

```javascript
// Isso vai falhar
const token_master = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // Master token
const ws = new WebSocket(`ws://localhost:8000/chat/ws?token=${token_master}`);

// Resultado: Conexão fechada com erro 1008
// "Only players can access chat"
```

### Player não pode criar usuários

```bash
curl -X POST http://localhost:8000/auth/users \
  -H "Authorization: Bearer <TOKEN_PLAYER>" \
  -H "Content-Type: application/json" \
  -d '{...}'

# Resultado: 403 Forbidden
# "Only Master can access this resource"
```

### Player não pode editar personagem de outro

```bash
# Player 1 tenta editar personagem de Player 2
curl -X PUT http://localhost:8000/characters/2 \
  -H "Authorization: Bearer <TOKEN_PLAYER1>" \
  -H "Content-Type: application/json" \
  -d '{...}'

# Resultado: 403 Forbidden
# "You don't have permission to edit this character"
```

---

## 📝 7. Exemplo Python Client

```python
import requests
import websocket
import json

# 1. Login
response = requests.post(
    "http://localhost:8000/auth/login",
    json={
        "login": "aragorn",
        "password": "super_seguro",
        "pin": "9876"
    }
)

token = response.json()["access_token"]
print(f"Token: {token}")

# 2. Obter perfil
response = requests.get(
    "http://localhost:8000/auth/me",
    headers={"Authorization": f"Bearer {token}"}
)
print(f"Perfil: {response.json()}")

# 3. Conectar ao chat
def on_message(ws, message):
    msg = json.loads(message)
    print(f"{msg['username']}: {msg['message']}")

def on_open(ws):
    ws.send(json.stringify({"message": "Olá!"}))

ws = websocket.WebSocketApp(
    f"ws://localhost:8000/chat/ws?token={token}",
    on_message=on_message,
    on_open=on_open
)

ws.run_forever()
```

---

## 🧪 8. Teste com Postman

### Coleção Postman (importar)

```json
{
  "info": {
    "name": "RPG API",
    "description": "Testes da API de RPG"
  },
  "item": [
    {
      "name": "Login Master",
      "request": {
        "method": "POST",
        "url": "http://localhost:8000/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\"login\":\"master\",\"password\":\"master123\",\"pin\":\"1234\"}"
        }
      }
    },
    {
      "name": "Login Player",
      "request": {
        "method": "POST",
        "url": "http://localhost:8000/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\"login\":\"aragorn\",\"password\":\"super_seguro\",\"pin\":\"9876\"}"
        }
      }
    }
  ]
}
```

---

Todos os exemplos acima podem ser executados! 🚀

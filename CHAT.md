# 💬 Sistema de Chat em Tempo Real

## 📋 Visão Geral

O chat é um sistema de comunicação **exclusivo para players** usando WebSockets para tempo real. O Master é bloqueado automaticamente.

---

## 🔒 Regras de Acesso

✅ **Players Autenticados**: Podem acessar o chat em tempo real  
❌ **Master**: Bloqueado automaticamente (erro 1008)  
❌ **Usuários Inativos**: Bloqueados  
❌ **Token Inválido/Expirado**: Bloqueado  

---

## 🔐 Autenticação

O WebSocket valida o token JWT antes da conexão:

```
URL: ws://localhost:8000/chat/ws?token=<JWT_TOKEN>
```

**Validações:**
- Token deve ser válido
- User role deve ser "player"
- Usuário deve estar ativo

---

## 📡 Endpoints REST

### Obter Histórico de Chat

```http
GET /chat/history?limit=50&offset=0
```

**Resposta:**
```json
{
  "messages": [
    {
      "id": 1,
      "user_id": 2,
      "username": "player1",
      "message": "Olá a todos!",
      "created_at": "2026-04-05T10:30:00"
    }
  ],
  "total": 1
}
```

### Obter Usuários Conectados

```http
GET /chat/active-users
```

**Resposta:**
```json
{
  "active_users": [
    {"user_id": 2, "username": "player1"},
    {"user_id": 3, "username": "player2"}
  ],
  "total": 2
}
```

---

## ⚡ WebSocket (Tempo Real)

### Conexão

```javascript
const token = "seu_jwt_token_aqui";
const ws = new WebSocket(`ws://localhost:8000/chat/ws?token=${token}`);

ws.onopen = () => {
  console.log("Conectado ao chat!");
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message);
};

ws.onclose = () => {
  console.log("Desconectado do chat");
};
```

### Enviar Mensagem

```javascript
ws.send(JSON.stringify({
  "message": "Olá a todos!"
}));
```

### Receber Mensagem

```json
{
  "id": 5,
  "user_id": 2,
  "username": "player1",
  "message": "Olá a todos!",
  "created_at": "2026-04-05T10:35:00",
  "message_type": "message"
}
```

### Tipos de Mensagem

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `message` | Mensagem normal de um player | Conteúdo enviado |
| `history` | Mensagem do histórico | Carregada na conexão |
| `system` | Mensagem do sistema | "player1 joined the chat" |
| `error` | Erro | "Message must be 1-1000 chars" |

---

## 🔄 Fluxo Completo

### 1️⃣ Player Faz Login

```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "player1",
    "password": "senha123",
    "pin": "5678"
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

### 2️⃣ Player Conecta ao WebSocket

```javascript
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const ws = new WebSocket(`ws://localhost:8000/chat/ws?token=${token}`);
```

### 3️⃣ Recebe Histórico

O servidor envia as últimas 20 mensagens com `message_type: "history"`

### 4️⃣ Recebe Notificação de Entrada

```json
{
  "user_id": 0,
  "username": "System",
  "message": "player1 joined the chat",
  "created_at": "2026-04-05T10:40:00",
  "message_type": "system"
}
```

### 5️⃣ Envia Mensagem

```javascript
ws.send(JSON.stringify({
  "message": "Oi pessoal!"
}));
```

### 6️⃣ Todos Recebem a Mensagem

```json
{
  "id": 10,
  "user_id": 2,
  "username": "player1",
  "message": "Oi pessoal!",
  "created_at": "2026-04-05T10:41:00",
  "message_type": "message"
}
```

### 7️⃣ Player Desconecta

O servidor envia:
```json
{
  "user_id": 0,
  "username": "System",
  "message": "player1 left the chat",
  "created_at": "2026-04-05T10:42:00",
  "message_type": "system"
}
```

---

## 🛡️ Segurança

✅ **Validação de Token**: JWT validado em cada conexão  
✅ **Controle de Role**: Apenas players autorizado  
✅ **Sanitização**: HTML escapado automaticamente  
✅ **Limite de Tamanho**: 1-1000 caracteres por mensagem  
✅ **Persistência**: Mensagens salvas no banco  
✅ **Usuário Ativo**: Rejeita usuários inativos  

---

## 📊 Estrutura de Dados

### ChatMessage (Banco)

```python
{
  "id": 1,
  "user_id": 2,
  "username": "player1",
  "message": "Olá!",
  "created_at": "2026-04-05T10:30:00"
}
```

### Broadcast de Mensagem

```json
{
  "id": 1,
  "user_id": 2,
  "username": "player1",
  "message": "Olá!",
  "created_at": "2026-04-05T10:30:00",
  "message_type": "message"
}
```

---

## 🚫 Tratamento de Erros

| Erro | Motivo | Solução |
|------|--------|--------|
| `1008 Policy Violation - Invalid token` | Token inválido/expirado | Faça login novamente |
| `1008 Policy Violation - Only players can access` | Tentou conectar como Master | Use uma conta player |
| `1008 Policy Violation - User not found` | Usuário não existe/inativo | Verifique status da conta |
| Message error: "Invalid message format" | JSON mal formatado | Valide o JSON |
| Message error: "1-1000 characters" | Mensagem muito curta/longa | Respeite o limite |

---

## 💾 Persistência

- Todas as mensagens são salvas no banco automaticamente
- Histórico pode ser consultado via `GET /chat/history`
- Mensagens antigas podem ser limpas manualmente (30+ dias)
- Ideal para auditoria e recuperação

---

## 🔄 Próximas Melhorias

- [ ] Salas/canais privados
- [ ] Edição de mensagens
- [ ] Reações (emojis)
- [ ] Menções (@player)
- [ ] Moderação e mute de players
- [ ] Fotos/arquivos
- [ ] Busca em histórico

---

## 🧪 Teste Rápido (cURL + WebSocket)

### Terminal 1: WebSocket Test
```bash
websocat "ws://localhost:8000/chat/ws?token=YOUR_JWT_TOKEN"
# Digitar mensagens e pressionar Enter
```

### Terminal 2: Obter Histórico
```bash
curl http://localhost:8000/chat/history
```

### Terminal 3: Listar Usuários Online
```bash
curl http://localhost:8000/chat/active-users
```

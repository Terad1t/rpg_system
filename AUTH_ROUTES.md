# 🔐 API Routes - Autenticação

## Login e Token

| Método | Rota | Autenticação | Descrição |
|--------|------|--------------|-----------|
| POST | `/auth/login` | ❌ Não | Faz login e obtém token JWT |
| POST | `/auth/initialize-master` | ❌ Não | Inicializa Master (só se não existir) |
| GET | `/auth/me` | ✅ JWT | Obtém perfil do usuário autenticado |

---

## Gerenciamento de Usuários (Master Only)

| Método | Rota | Autenticação | Descrição |
|--------|------|--------------|-----------|
| GET | `/auth/users` | ✅ Master | Lista todos os usuários |
| GET | `/auth/users/{user_id}` | ✅ Master | Obtém usuário específico |
| POST | `/auth/users` | ✅ Master | Cria novo usuário |
| PUT | `/auth/users/{user_id}` | ✅ Master | Atualiza usuário |
| DELETE | `/auth/users/{user_id}` | ✅ Master | Deleta usuário |
| POST | `/auth/users/{user_id}/deactivate` | ✅ Master | Desativa usuário |

---

## Exemplos de Requisição

### 1. Login
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "master",
    "password": "master123",
    "pin": "1234"
  }'
```

### 2. Usar Token em Requisição
```bash
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Criar Player (Master Only)
```bash
curl -X POST "http://localhost:8000/auth/users" \
  -H "Authorization: Bearer <TOKEN_MASTER>" \
  -H "Content-Type: application/json" \
  -d '{
    "login": "player1",
    "password": "senha123",
    "pin": "5678",
    "role": "player",
    "is_active": true
  }'
```

### 4. Listar Usuários (Master Only)
```bash
curl -X GET "http://localhost:8000/auth/users" \
  -H "Authorization: Bearer <TOKEN_MASTER>"
```

---

## Estrutura do Token JWT

```json
{
  "sub": "1",
  "role": "master",
  "exp": 1712258823
}
```

- `sub`: User ID
- `role`: "master" ou "player"
- `exp`: Unix timestamp de expiração

---

## Status HTTP

| Código | Significado | Causa |
|--------|-------------|-------|
| 200 | OK | Requisição bem-sucedida |
| 400 | Bad Request | Dados inválidos ou login já existe |
| 401 | Unauthorized | Credenciais inválidas ou token expirado |
| 403 | Forbidden | Não tem permissão (ex: player tentando criar usuário) |
| 404 | Not Found | Usuário não encontrado |

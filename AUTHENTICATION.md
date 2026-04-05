# 🔐 Sistema de Autenticação - Documentação

## 📋 Visão Geral

O sistema de autenticação implementa controle de acesso baseado em roles (Master/Player) com JWT e validação de 3 fatores (login, senha, PIN).

---

## 🔑 Credenciais Iniciais

Quando a API é iniciada, um Master padrão é criado automaticamente:

```
Login: master
Senha: master123
PIN: 1234
```

**⚠️ IMPORTANTE**: Após a primeira execução, **mude essas credenciais imediatamente** em produção!

---

## 🔐 Fluxo de Autenticação

### 1️⃣ Login (Obter Token)

```http
POST /auth/login
Content-Type: application/json

{
  "login": "master",
  "password": "master123",
  "pin": "1234"
}
```

**Resposta (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 1,
  "role": "master"
}
```

### 2️⃣ Usar o Token nas Requisições

```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 👑 Operações do Master

### Criar Novo Usuário

```http
POST /auth/users
Authorization: Bearer <TOKEN_DO_MASTER>
Content-Type: application/json

{
  "login": "player1",
  "password": "senha123",
  "pin": "5678",
  "role": "player",
  "is_active": true
}
```

**Resposta (200):**
```json
{
  "id": 2,
  "login": "player1",
  "role": "player",
  "is_active": true,
  "created_by": 1,
  "created_at": "2026-04-05T10:30:00",
  "updated_at": "2026-04-05T10:30:00"
}
```

### Listar Todos os Usuários

```http
GET /auth/users?skip=0&limit=100
Authorization: Bearer <TOKEN_DO_MASTER>
```

### Obter Usuário Específico

```http
GET /auth/users/2
Authorization: Bearer <TOKEN_DO_MASTER>
```

### Atualizar Usuário

```http
PUT /auth/users/2
Authorization: Bearer <TOKEN_DO_MASTER>
Content-Type: application/json

{
  "password": "nova_senha",
  "pin": "9999",
  "is_active": true,
  "role": "player"
}
```

### Desativar Usuário (sem deletar)

```http
POST /auth/users/2/deactivate
Authorization: Bearer <TOKEN_DO_MASTER>
```

### Deletar Usuário

```http
DELETE /auth/users/2
Authorization: Bearer <TOKEN_DO_MASTER>
```

---

## 👤 Operações do Player

### Ver Seu Perfil

```http
GET /auth/me
Authorization: Bearer <TOKEN_DO_PLAYER>
```

---

## 🛡️ Segurança

### Hash de Senha e PIN

- **Algoritmo**: bcrypt com salt automático
- **Rounds**: 12 (padrão do passlib)
- Senhas e PINs nunca são armazenados em texto puro

### JWT (JSON Web Token)

- **Algoritmo**: HS256
- **Duração**: 8 horas (480 minutos)
- **Conteúdo**:
  ```json
  {
    "sub": "1",           // user_id
    "role": "master",     // ou "player"
    "exp": 1712258823     // timestamp de expiração
  }
  ```

### Validações

- ✅ Login único (constraint UNIQUE)
- ✅ Usuário deve estar ativo para autenticar
- ✅ Apenas Master pode criar/editar usuários
- ✅ Apenas 1 Master permitido no sistema
- ✅ Tokens inválidos/expirados são rejeitados

---

## 🔄 Mudança de Senha/PIN

O Master pode atualizar qualquer usuário:

```http
PUT /auth/users/2
Authorization: Bearer <TOKEN_DO_MASTER>

{
  "password": "nova_senha_aqui",
  "pin": "novo_pin_aqui"
}
```

---

## ⏱️ Tempo de Expiração do Token

- **Duração**: 8 horas
- **Após expiração**: Usuário precisa fazer login novamente
- **Refresh**: Atualmente não implementado (considerar para versão futura)

---

## 🚫 Erros Comuns

| Erro | Causa | Solução |
|------|-------|--------|
| **401 Unauthorized** | Token inválido/expirado | Faça login novamente |
| **403 Forbidden** | Não tem permissão | Use conta Master para operações administrativas |
| **400 Bad Request** | Credenciais inválidas | Verifique login, senha e PIN |
| **400 Bad Request** | Login já existe | Use outro login |
| **400 Bad Request** | Tentando criar Master | Apenas 1 Master é permitido |

---

## 📊 Modelo de Dados (User)

```python
{
  "id": 1,                           # Imutável
  "login": "master",                 # Único
  "password_hash": "bcrypt_hash",    # Nunca retornado na API
  "pin_hash": "bcrypt_hash",         # Nunca retornado na API
  "role": "master",                  # "master" ou "player"
  "is_active": true,                 # Ativo/Inativo
  "created_by": null,                # ID de quem criou (null para Master inicial)
  "created_at": "2026-04-05T...",   # Timestamp
  "updated_at": "2026-04-05T..."    # Timestamp
}
```

---

## 🔄 Fluxo Completo: Master Criando um Player

1. **Master faz login**
   ```http
   POST /auth/login
   ```

2. **Master cria um novo player**
   ```http
   POST /auth/users (com token do Master)
   ```

3. **Player recebe suas credenciais** (via email/chat/outro canal)

4. **Player faz seu primeiro login**
   ```http
   POST /auth/login (com credenciais do player)
   ```

5. **Player pode acessar recursos dele**
   ```http
   GET /my-characters (com token do player)
   ```

---

## 🚀 Próximas Melhorias

- [ ] Refresh tokens (manter sessão viva)
- [ ] Logs de acesso e auditoria
- [ ] Two-factor authentication (2FA)
- [ ] Reset de senha por email
- [ ] Histórico de alterações de usuários
- [ ] Rate limiting no login

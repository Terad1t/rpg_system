# 📚 Guia Completo - Sistema de RPG

## 🎯 O que foi implementado

Um backend completo de RPG com:
- ✅ Autenticação JWT (Master + Players)
- ✅ Chat em tempo real (Players only)
- ✅ Sistema de personagens com permissões
- ✅ Mapa do mundo (regiões, países, vilas)
- ✅ Itens, habilidades, raças, classes
- ✅ Controle de acesso baseado em roles

---

## 📂 Estrutura de Pastas

```
rpg_system/
├── backend/
│   ├── master/                      # Módulo administrativo
│   │   ├── models/                 # Modelos SQLAlchemy
│   │   │   ├── character_model.py
│   │   │   ├── attribute_model.py
│   │   │   ├── raca_model.py
│   │   │   ├── classe_model.py
│   │   │   ├── item_model.py
│   │   │   ├── habilidades_model.py
│   │   │   ├── user_model.py
│   │   │   ├── chat_message_model.py
│   │   │   ├── region_model.py
│   │   │   ├── country_model.py
│   │   │   ├── village_model.py
│   │   │   └── [mais modelos...]
│   │   │
│   │   ├── schemas/                # Validação Pydantic
│   │   │   ├── character_schema.py
│   │   │   ├── auth_schema.py
│   │   │   ├── chat_schema.py
│   │   │   └── [mais schemas...]
│   │   │
│   │   ├── services/               # Lógica de negócio
│   │   │   ├── character_services.py
│   │   │   ├── auth_services.py
│   │   │   ├── chat_services.py
│   │   │   └── [mais services...]
│   │   │
│   │   ├── controllers/            # Endpoints REST
│   │   │   ├── character_controller.py
│   │   │   ├── auth_controller.py
│   │   │   ├── chat_controller.py
│   │   │   └── [mais controllers...]
│   │   │
│   │   ├── utils/                  # Utilitários
│   │   │   ├── auth_utils.py       # Hash, JWT
│   │   │   ├── auth_dependencies.py # Validações
│   │   │   ├── chat_manager.py     # WebSocket manager
│   │   │   └── __init__.py
│   │   │
│   │   ├── database/
│   │   │   └── connection.py       # SQLAlchemy setup
│   │   │
│   │   └── main.py                 # App FastAPI
│   │
│   └── player/                     # Módulo jogador
│       ├── controllers/
│       │   └── player_character_controller.py
│       ├── services/
│       │   └── player_character_services.py
│       └── __init__.py
│
├── pyproject.toml                  # Dependências
├── ARCHITECTURE.md                 # Arquitetura Master/Player
├── AUTHENTICATION.md               # Documentação Auth
├── AUTH_ROUTES.md                  # Referência de rotas Auth
├── CHAT.md                         # Documentação Chat
├── CHAT_TECHNICAL.md               # Detalhes técnicos Chat
└── chat_test.html                  # Interface de teste Chat
```

---

## 🔑 Modelos Principais

### User
```python
{
  "id": 1,
  "login": "master",
  "password_hash": "bcrypt...",
  "pin_hash": "bcrypt...",
  "role": "master",  # "master" ou "player"
  "is_active": true,
  "created_by": null,
  "created_at": datetime,
  "updated_at": datetime
}
```

### Character
```python
{
  "id": 1,
  "name": "Han Solo",           # Imutável
  "age": 35,                    # Imutável
  "tipo": "player",
  "raca_id": 1,                 # Imutável
  "classe_id": 2,
  "codename": "Contrabandista", # Editável
  "description": "Piloto",      # Editável
  "user_id": "player1"          # Link ao jogador
}
```

### ChatMessage
```python
{
  "id": 1,
  "user_id": 2,
  "username": "player1",
  "message": "Olá a todos!",
  "created_at": datetime
}
```

### Map Hierarchy
```
Region
  ├── name, description, climate
  └── Country
      ├── name, description, image
      └── Village
          ├── name, description, image
```

---

## 🔐 Fluxo de Autenticação

### 1. Login
```http
POST /auth/login
{
  "login": "player1",
  "password": "senha123",
  "pin": "5678"
}
```

### 2. Resposta
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 2,
  "role": "player"
}
```

### 3. Usar Token
```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 💬 Fluxo do Chat

### 1. Login do Player
```bash
POST /auth/login → Recebe JWT
```

### 2. Conectar WebSocket
```javascript
const ws = new WebSocket(`ws://localhost:8000/chat/ws?token=${JWT}`);
```

### 3. Receber Histórico
Servidor envia últimas 20 mensagens

### 4. Enviar Mensagem
```javascript
ws.send(JSON.stringify({message: "Olá!"}));
```

### 5. Broadcast
Todos os players conectados recebem a mensagem em tempo real

---

## 📡 Principais Endpoints

### Autenticação
```
POST   /auth/login              Login
POST   /auth/initialize-master  Inicializar Master
GET    /auth/me                 Perfil
POST   /auth/users              Criar usuário (Master)
GET    /auth/users              Listar usuários (Master)
PUT    /auth/users/{id}         Atualizar usuário (Master)
DELETE /auth/users/{id}         Deletar usuário (Master)
```

### Chat
```
WS     /chat/ws                 WebSocket (Players)
GET    /chat/history            Histórico
GET    /chat/active-users       Usuários online
```

### Personagens
```
POST   /characters/             Criar (Master)
GET    /characters/             Listar
PUT    /characters/{id}         Atualizar (Master)
DELETE /characters/{id}         Deletar (Master)

GET    /my-characters/          Meus personagens (Player)
PUT    /my-characters/{id}      Editar codinome/descrição (Player)
```

### Mapa
```
POST   /regions/                Criar região (Master)
GET    /countries/              Listar países
PUT    /villages/{id}           Atualizar vila (Master)
```

---

## 🔐 Controle de Acesso

### Master (role="master")
✅ Acesso total a tudo
✅ Criar/editar/deletar entidades
✅ Gerenciar usuários
❌ Não acessa chat

### Player (role="player")
✅ Ver personagens
✅ Editar codinome/descrição
✅ Acessar chat
❌ Não cria usuários
❌ Não acessa dados administrativos

---

## 🛠️ Tecnologias Utilizadas

- **FastAPI** - Framework web
- **SQLAlchemy** - ORM
- **Pydantic** - Validação de dados
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas
- **WebSockets** - Chat em tempo real
- **SQLite** - Banco de dados

---

## 🚀 Como Rodar

### 1. Instalar Dependências
```bash
pip install -e .
```

### 2. Iniciar API
```bash
uvicorn backend.master.main:app --reload
```

### 3. Acessar Documentação
```
http://127.0.0.1:8000/docs
```

### 4. Teste Chat
```
Abra chat_test.html no navegador
```

---

## 📊 Credenciais Iniciais

**Master:**
```
Login: master
Senha: master123
PIN: 1234
```

**Teste Player:**
```
Login: player1
Senha: senha123
PIN: 5678
```

⚠️ **Mude em produção!**

---

## 📚 Documentação

- `ARCHITECTURE.md` - Estrutura Master/Player
- `AUTHENTICATION.md` - Sistema auth completo
- `AUTH_ROUTES.md` - Referência de rotas
- `CHAT.md` - Chat em tempo real
- `CHAT_TECHNICAL.md` - Detalhes técnicos

---

## 🧪 Teste Rápido

### Login (Master)
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"master","password":"master123","pin":"1234"}'
```

### Criar Player
```bash
curl -X POST http://localhost:8000/auth/users \
  -H "Authorization: Bearer <TOKEN_MASTER>" \
  -H "Content-Type: application/json" \
  -d '{
    "login":"novo_player",
    "password":"senha",
    "pin":"1234",
    "role":"player"
  }'
```

### Chat
```bash
# Abra chat_test.html no navegador
```

---

## 🎯 Próximas Melhorias

- [ ] Refresh tokens
- [ ] Dois-fatores (2FA)
- [ ] Logs de auditoria
- [ ] Salas privadas de chat
- [ ] Sistema de permissões granulares
- [ ] Rate limiting
- [ ] Testes unitários
- [ ] Dockerização

---

## 💡 Notas Importantes

1. **JWT**: Válido por 8 horas
2. **Master Único**: Sistema impede criar mais de um Master
3. **Usuários Inativos**: Não podem autenticar
4. **Chat**: Apenas players, Master bloqueado automaticamente
5. **Banco**: SQLite (mudar para PostgreSQL em produção)

---

## 🆘 Troubleshooting

| Problema | Solução |
|----------|---------|
| Token expirado | Faça login novamente |
| 401 Unauthorized | Valide o token JWT |
| 403 Forbidden | Verifique permissões (Master/Player) |
| WebSocket conecta Master | Erro esperado - Master bloqueado |
| Banco não encontrado | Execute `Base.metadata.create_all()` |

---

Tudo está pronto para começar! 🚀

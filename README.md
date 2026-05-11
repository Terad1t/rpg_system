
# RPG System

Sistema de RPG com API em FastAPI (Master + Player), autenticação JWT e comunicação em tempo real via WebSockets (chat, updates e inventário). Este repositório também inclui um frontend React (Vite + Tailwind).

## Visão geral

- **Backend (FastAPI)** em `backend/master/main.py` com rotas de Master e de Player.
- **Autenticação JWT** (login/senha/PIN) e papéis `master` e `player`.
- **WebSockets**:
	- Chat em tempo real (players) em `/api/chat/ws`
	- Updates em tempo real (players) em `/api/updates/ws`
	- Atualizações de inventário em `/ws/inventory/{character_id}`
	- Notificações por usuário em `/ws/user-updates/{user_id}`
- **Banco**: SQLite local (`./rpg_system.db`) via SQLAlchemy.

> Nota importante sobre rotas: o backend inclui a maioria dos routers com `prefix="/api"`. Então, por exemplo, `auth` é servido em `/api/auth/...`.

## Ferramentas usadas

### Backend e dados

- Python 3.14+
- FastAPI
- Uvicorn
- SQLAlchemy
- Alembic
- SQLite
- JWT com `python-jose`
- `passlib` e `bcrypt` para senhas
- `python-multipart` para formulários e uploads
- `websockets` para comunicação em tempo real
- `requests` para integrações HTTP
- `Flask`
- `matplotlib`
- `pandas`
- `scikit-learn`
- `ttkbootstrap`

### Frontend

- React
- React DOM
- Vite
- Tailwind CSS
- Axios
- React Router DOM
- Recharts

### Testes e qualidade

- Vitest
- Testing Library (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`)
- jsdom
- `@vitest/coverage-v8`
- `@vitest/ui`
- PostCSS
- Autoprefixer

## Estrutura do repositório

- `backend/master/`: API principal (Master) + recursos compartilhados
- `backend/player/`: rotas e serviços específicos do Player
- `frontend/`: app React (Vite)
- `alembic/`: configuração de migrations
- Scripts úteis: `populate_data.py`, `create_test_players.py`, `send_message_single.py`, etc.

## Requisitos

- Python (ver `pyproject.toml`: `requires-python = ">=3.14"`)
- Node.js (recomendado 18+)

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do repositório (ele já está no `.gitignore`).

### Backend

- `SECRET_KEY` (obrigatória): chave usada para assinar/validar JWT.
- `MASTER_BOOTSTRAP_TOKEN` (recomendada): habilita a rota de inicialização segura do Master.

Exemplo de `.env`:

```env
SECRET_KEY=dev-secret-change-me
MASTER_BOOTSTRAP_TOKEN=dev-bootstrap-token-change-me
```

### Frontend

O frontend aceita as seguintes variáveis (opcionais):

- `VITE_API_URL` (default: `http://127.0.0.1:8000`)
- `VITE_WS_URL` (default: `ws://127.0.0.1:8000`)

Você pode criar `frontend/.env.local`:

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_WS_URL=ws://127.0.0.1:8000
```

## Rodando o backend

### 1) Instalar dependências

As dependências estão listadas em `pyproject.toml`.

- Se você está com a versão de Python compatível com `requires-python`, pode usar:

```bash
python -m venv .venv
```

Windows (PowerShell):

```powershell
.\.venv\Scripts\Activate.ps1
pip install -e .
```

- Se seu Python não atender `requires-python` do projeto, instale manualmente os pacotes necessários (mínimo para a API):

```powershell
pip install fastapi uvicorn sqlalchemy alembic passlib python-jose[cryptography] python-multipart websockets
```

### 2) Subir a API

```powershell
uvicorn backend.master.main:app --reload --host 127.0.0.1 --port 8000
```

Prova de vida:

- Swagger: `http://127.0.0.1:8000/docs`
- OpenAPI: `http://127.0.0.1:8000/openapi.json`

## Inicialização do Master (primeira vez)

O bootstrap automático do Master está desativado. Para criar o primeiro Master, use a rota segura `POST /api/auth/initialize-master` com o header `X-Master-Bootstrap-Token`.

1) Garanta que `MASTER_BOOTSTRAP_TOKEN` está definido no `.env`.

2) Faça a chamada (exemplo com `curl`):

```bash
curl -X POST "http://127.0.0.1:8000/api/auth/initialize-master" \
	-H "Content-Type: application/json" \
	-H "X-Master-Bootstrap-Token: dev-bootstrap-token-change-me" \
	-d '{"login":"master","password":"masterpass","pin":"1234"}'
```

Se já existir Master, a API retornará erro informando que ele já existe.

## Autenticação

### Login

`POST /api/auth/login`

Body:

```json
{ "login": "...", "password": "...", "pin": "1234" }
```

Resposta (exemplo):

```json
{ "access_token": "...", "token_type": "bearer", "user_id": 1, "role": "player" }
```

### Usar token nos endpoints REST

Inclua o header:

```
Authorization: Bearer <access_token>
```

## WebSockets (tempo real)

### Como enviar o token

Os WebSockets usam `Sec-WebSocket-Protocol` (subprotocol) para carregar o JWT. Em navegadores, isso é suportado passando uma lista de subprotocols:

```js
const ws = new WebSocket('ws://127.0.0.1:8000/api/chat/ws', ['bearer', token])
```

> Observação: apesar de alguns docstrings mencionarem `?token=...`, o backend extrai o token por **header/subprotocol** (não por query param).

### Endpoints WebSocket

- Chat (somente players): `ws://127.0.0.1:8000/api/chat/ws`
- Updates (somente players): `ws://127.0.0.1:8000/api/updates/ws`
- Inventário (master qualquer personagem; player apenas os próprios): `ws://127.0.0.1:8000/ws/inventory/{character_id}`
- Notificações por usuário (somente o próprio usuário): `ws://127.0.0.1:8000/ws/user-updates/{user_id}`

## Principais rotas REST (visão rápida)

Base URL (dev): `http://127.0.0.1:8000`

- Auth: `/api/auth/...`
	- `POST /api/auth/initialize-master`
	- `POST /api/auth/login`
	- `GET /api/auth/me`
	- `GET/POST/PUT/DELETE /api/auth/users...` (Master)
- Chat: `/api/chat/history`, `/api/chat/active-users`
- Updates: `/api/updates/active-users`
- Player (exemplo): `/api/my-characters/...`

Para a lista completa e atualizada, use `/docs`.

## Rodando o frontend

Em `frontend/`:

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Testes

### Frontend

Em `frontend/`:

```bash
npm test
```

### Backend

Há scripts de teste e verificação na raiz (ex.: `test_chat_auto.py`, `verify_chat_history_access.py`).

Se você quiser rodar como suite pytest, instale extras e execute:

```powershell
pip install -e ".[test]"
pytest
```

## Banco de dados e migrations

- O backend usa SQLite em `./rpg_system.db`.
- O projeto inclui Alembic em `alembic/`.

Se você tiver migrations presentes em `alembic/versions/`, rode:

```bash
alembic upgrade head
```

## Troubleshooting

- **Erro `SECRET_KEY environment variable is required`**: defina `SECRET_KEY` no `.env` (raiz) ou exporte na sessão do terminal.
- **Windows + `.env` com BOM**: o loader do backend lê `.env` com `utf-8-sig` para evitar problemas de BOM.
- **API responde 404 em `/` mas está viva**: valide usando `/docs` ou `/openapi.json`.
- **WebSocket não autentica**: use subprotocol `['bearer', token]` (não query param).

## Documentação adicional no repositório

- GETTING_STARTED.md
- ARCHITECTURE.md
- AUTHENTICATION.md
- AUTH_ROUTES.md
- CHAT.md
- CHAT_TECHNICAL.md
- SETUP_FRONTEND.md
- TESTING.md
- QUICK_START_TESTING.md
- SUMMARY_TESTING.md
- INTERFACE_TESTING.md
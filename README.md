# RPG System

Plataforma web para mesas de RPG: o **Mestre** cadastra o mundo (raças, classes, itens, habilidades, buffs), aprova personagens e conduz lutas por turno; os **jogadores** acompanham a ficha, o inventário e o mapa, conversam no chat e agem nas lutas, tudo em tempo real.

**Stack:** FastAPI · SQLAlchemy 2 · Pydantic 2 · WebSockets · React 18 · TypeScript · TanStack Query · Vite · Tailwind · Vitest · Pytest

## Funcionalidades

| Mestre | Jogador |
| --- | --- |
| Cria as contas dos jogadores (login, senha e PIN) | Pede a criação de personagens (até 3) |
| Aprova ou recusa personagens e define os atributos iniciais | Edita codinome, descrição e retrato |
| Cadastra raças, classes, itens, habilidades, buffs/debuffs e o mapa do mundo | Vê ficha, efeitos ativos, inventário, habilidades e o mapa |
| Aplica dano, cura e efeitos temporários na ficha | Recebe convites de luta e age na sua vez |
| Convida jogadores para lutas e controla os turnos | Conversa no chat global usando o codinome |
| Painel com estatísticas de dano e cura por luta | Distribui pontos de atributo e guarda anotações pessoais |

## Como rodar localmente

Pré-requisitos: [uv](https://docs.astral.sh/uv/) (Python 3.12+) e Node.js 20+.

```bash
# 1. Configuração
cp .env.example .env
# edite .env e preencha SECRET_KEY:
uv run python -c "import secrets; print(secrets.token_urlsafe(48))"

# 2. Backend (http://127.0.0.1:8000, documentação em /docs)
uv sync
uv run python -m scripts.create_user --role master --login mestre   # pede senha e PIN
uv run python -m scripts.seed_demo                                   # opcional: dados de exemplo
uv run uvicorn backend.master.main:app --reload

# 3. Frontend (http://localhost:5173), em outro terminal
cd frontend
npm ci
npm run dev
```

Em desenvolvimento o Vite repassa `/api`, `/ws` e `/static` para o backend, então não há configuração de URL no frontend. Os jogadores são criados pelo Mestre na aba **Contas**.

## Testes e qualidade

```bash
uv sync --extra test --extra dev
uv run pytest                 # backend (≈200 testes)
uv run ruff check backend scripts

cd frontend
npm run typecheck && npm run lint && npm run test:run
npm run build
```

O teste `backend/tests/test_route_security.py` percorre **todas** as rotas da API e falha se alguma responder sem autenticação, ou se uma rota do Mestre aceitar um jogador. Assim uma rota nova não fica aberta por esquecimento.

## Segurança

- Login com usuário, senha **e** PIN; senhas e PINs com hash (PBKDF2-SHA256); limite de tentativas por IP e login.
- JWT assinado com `SECRET_KEY` (obrigatória). O papel do usuário é lido do banco a cada requisição: desativar ou rebaixar uma conta invalida o token na hora.
- Todas as rotas exigem login, exceto `/api/auth/login`, `/api/auth/initialize-master` (protegida por `MASTER_BOOTSTRAP_TOKEN`) e `/health`.
- Jogadores só acessam os próprios personagens, inventário, ficha ao vivo e as lutas em que estão.
- Upload de retrato: só PNG, JPEG ou WebP (verificado pelo conteúdo do arquivo), com tamanho máximo e nome gerado pelo servidor.
- CORS restrito às origens em `CORS_ORIGINS`.

> **Bancos antigos:** versões anteriores deste repositório versionavam `rpg_system.db` com contas de teste. Se algum servidor usou esse arquivo, troque as senhas de todas as contas. O arquivo saiu do repositório, mas continua no histórico do git.

## Estrutura

```
backend/
  master/
    core/          configuração (.env), uploads, rate limit, tarefas em segundo plano
    controllers/   rotas HTTP e WebSocket (finas: validam, chamam serviços, notificam)
    services/      regras de negócio
    models/        modelos SQLAlchemy
    schemas/       contratos de entrada e saída (Pydantic)
    utils/         autenticação, conexões WebSocket, expiração de efeitos
  player/          rotas e serviços exclusivos do jogador
  tests/           pytest
frontend/src/
  api/             tipos da API, cliente HTTP e hooks de dados (React Query)
  auth/, realtime/ sessão e conexões em tempo real
  features/        telas do Mestre e do jogador
  ui/              componentes visuais do tema
scripts/           criação de usuários e dados de exemplo
docs/              arquitetura e decisões
```

Detalhes de arquitetura, canais em tempo real e decisões técnicas em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Variáveis de ambiente

Todas estão documentadas em [.env.example](.env.example) (backend) e [frontend/.env.example](frontend/.env.example).

| Variável | Para quê |
| --- | --- |
| `SECRET_KEY` | Assinatura dos tokens (obrigatória) |
| `DATABASE_URL` | Banco (padrão: SQLite em `./rpg_system.db`) |
| `CORS_ORIGINS` | Origens do frontend autorizadas, separadas por vírgula |
| `MASTER_BOOTSTRAP_TOKEN` | Habilita a criação do Mestre pela API; remova depois de usar |
| `MAX_UPLOAD_BYTES`, `LOGIN_MAX_ATTEMPTS`, `LOGIN_WINDOW_SECONDS`, `ACCESS_TOKEN_EXPIRE_MINUTES` | Limites opcionais |

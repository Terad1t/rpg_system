# Arquitetura

## Visão geral

```
Navegador (React)
  │  HTTP  /api/...        → FastAPI (controllers → services → SQLAlchemy)
  │  WS    /ws/...,        → hubs de conexão em memória (utils/)
  │        /api/chat/ws, /api/updates/ws
  ▼
Vite (dev) ou servidor estático (prod)
```

O backend é um único processo FastAPI. Em desenvolvimento o Vite faz proxy de `/api`, `/ws` e `/static`, então frontend e API parecem estar na mesma origem.

## Camadas do backend

- **controllers/**: recebem a requisição, aplicam a autorização (`Depends(get_current_user | get_current_master | get_current_player)`), chamam o serviço e publicam notificações. Não devem conter regra de negócio.
- **services/**: regras (limite de personagens, aprovação em uma transação, convites, turnos, distribuição de pontos). Levantam `ValueError`/`UserRuleError` com mensagens seguras para o cliente.
- **schemas/**: todo corpo de requisição tem um modelo Pydantic. Payloads livres (`dict`) foram eliminados; ações do Master usam `extra="forbid"` para recusar campos desconhecidos.
- **core/**: configuração (`get_settings()`), hora UTC (`utcnow()`), uploads, rate limit e tarefas em segundo plano (`spawn()` guarda referência às tasks para o GC não cancelá-las).

### Autenticação

`resolve_user_from_token()` decodifica o JWT e **busca o usuário no banco**; o `role` usado nas checagens é o do banco, não o do token. WebSockets usam `authenticate_websocket()`, que abre uma sessão curta só para autenticar: conexões longas não seguram uma conexão do pool.

## Tempo real

| Canal | Quem conecta | Conteúdo |
| --- | --- | --- |
| `/ws/user-updates/{user_id}` | o próprio usuário | convites e início de luta, turnos, ações, aprovação de personagem, avisos ao Mestre |
| `/ws/inventory/{character_id}` | dono ou Master | itens adicionados, removidos ou alterados |
| `/ws/character-view/{character_id}` | dono ou Master | mudanças de HP, buffs, visibilidade |
| `/api/chat/ws` | jogadores | chat global (histórico recente ao conectar) |
| `/api/updates/ws` | jogadores | mudanças no mundo (personagens, habilidades, mapas) |

O token vai em `?token=` (ou no subprotocolo `bearer, <token>`). No frontend, `useSocket` reconecta com backoff exponencial e o `NotificationsProvider` mantém **uma** conexão de notificações por sessão. Cada tipo de evento invalida as consultas do React Query que ele afeta (ex.: `fight_event` recarrega a luta), então as telas se atualizam sozinhas; quem precisa reagir de outro jeito (abrir o convite, ir para o combate) assina com `useNotificationEvent`. O Mestre não recebe os eventos de ação das lutas em que não participa, então a tela de luta dele consulta a API a cada 4 s enquanto a luta está em andamento.

Os hubs ficam em memória, então a API deve rodar com **um worker**. Para escalar horizontalmente, troque `utils/broadcast.py`, `utils/chat_manager.py` e `utils/inventory_manager.py` por um backend Pub/Sub (ex.: Redis); a interface usada pelos controllers não muda.

## Lutas

1. O Mestre cria a luta e convida jogadores (`POST /fights/{id}/invite`, prazo de 5 a 300 s).
2. Cada jogador responde por si (`POST /fights/{id}/respond`; o usuário vem do token). Ao fim do prazo, pendentes viram recusa e o Mestre recebe o resumo.
3. `PUT /fights/{id}/start` registra os participantes e passa a vez ao primeiro que aceitou.
4. `POST /fights/{id}/entries/player` confere a vez **antes** de gravar; o Mestre avança o turno com `/turn/advance`.

## Banco de dados e migrações

SQLite por padrão (`DATABASE_URL` aceita qualquer banco suportado pelo SQLAlchemy). Na inicialização, `create_all()` cria tabelas novas e `ensure_schema_updates()` adiciona colunas que bancos de versões antigas não têm. Em SQLite, ela também reconstrói tabelas em que uma coluna inteira foi criada como texto por versões antigas (ex.: `characters.user_id VARCHAR`, que fazia o dono do personagem receber 403); o procedimento segue a recomendação do SQLite (tabela nova, cópia, troca de nome) e só roda uma vez. Em SQLite as chaves estrangeiras são ativadas (`PRAGMA foreign_keys=ON`); violações viram resposta 409.

Ao migrar para Postgres, a recomendação é adotar Alembic com uma revisão inicial gerada a partir dos modelos atuais e remover `ensure_schema_updates()`.

## Decisões e limites conhecidos

- **Tailwind 4**: configuração no próprio CSS (`@theme` em `frontend/src/index.css`); os tokens de cor ficam em `:root` como canais RGB para permitir opacidade (`bg-gold/20`).
- **passlib**: mantido para não invalidar os hashes já gravados; não tem manutenção ativa. Uma troca futura deve verificar o formato `$pbkdf2-sha256$` e regravar o hash no próximo login.
- **Rate limit em memória**: vale por processo, coerente com o modelo de um worker.

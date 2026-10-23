# RPG System — Frontend

React 18 + TypeScript + Vite + Tailwind, com TanStack Query para dados e WebSockets para tempo real. Tema visual "fantasia sombria" (Cinzel nos títulos, dourado sobre fundo escuro). Instruções gerais, backend e segurança no [README principal](../README.md).

```bash
npm ci
npm run dev        # http://localhost:5173 (proxy de /api, /ws e /static para o backend)
npm run typecheck  # TypeScript
npm run lint       # ESLint
npm run test:run   # Vitest + Testing Library
npm run build      # checa tipos e gera dist/
```

Variáveis em [.env.example](.env.example). Em desenvolvimento nenhuma é necessária.

## Organização

```
src/
  api/          types.ts (contratos da API), client.ts (axios), queries.ts (hooks do React Query)
  auth/         AuthProvider: login, logout e expiração automática do token
  realtime/     useSocket (WebSocket com reconexão) e NotificationsProvider (um canal por sessão)
  layout/       layouts do Mestre (menu lateral) e do jogador, sino de notificações
  features/
    auth/       tela de entrada
    master/     telas do Mestre; CrudPage é a base dos cadastros
    player/     escolha de personagem, ficha, inventário, chat, lutas
  ui/           componentes visuais (Button, Panel, campos, Modal, toasts, confirmação, StatBar)
  lib/          sessão, datas, efeitos, textos das notificações
```

## Rotas

| Rota | Quem | Tela |
| --- | --- | --- |
| `/entrar` | todos | login |
| `/mestre` | Mestre | visão geral (totais e gráficos) |
| `/mestre/personagens` | Mestre | dano, cura, efeitos, ficha, visibilidade e histórico |
| `/mestre/solicitacoes` | Mestre | aprovar ou recusar personagens pedidos |
| `/mestre/lutas` | Mestre | criar, convidar, iniciar, turnos e registro |
| `/mestre/mundo` | Mestre | regiões, países, vilas e locais |
| `/mestre/itens`, `/habilidades`, `/efeitos`, `/racas`, `/classes`, `/contas` | Mestre | cadastros |
| `/jogador` | jogador | escolher ou pedir personagem |
| `/jogador/personagem/:id` | jogador | ficha, inventário, habilidades, mapa, anotações, edição, chat |
| `/jogador/luta/:id` | jogador | sala de espera |
| `/jogador/luta/:id/combate` | jogador | agir na própria vez |

## Convenções

- Leitura de dados sempre por hooks de `api/queries.ts`; escrita por `useAction`, que mostra o aviso e recarrega as chaves afetadas.
- Eventos em tempo real recarregam o cache automaticamente (`NotificationsProvider`); telas que precisam reagir usam `useNotificationEvent`.
- Cores só pelos tokens do tema (`text-parchment`, `bg-surface`, `text-gold`...), definidos em `src/index.css`.

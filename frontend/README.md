# RPG System — Frontend

React 18 + Vite + Tailwind. Instruções gerais, backend e segurança no [README principal](../README.md).

```bash
npm ci
npm run dev        # http://localhost:5173 (proxy de /api, /ws e /static para o backend)
npm run test:run   # testes (Vitest + Testing Library)
npm run lint       # ESLint
npm run build      # build de produção em dist/
```

Variáveis em [.env.example](.env.example). Em desenvolvimento nenhuma é necessária; em produção, `VITE_API_URL`/`VITE_WS_URL` só são precisas se a API estiver em outro domínio.

## Organização

- `context/AuthContext.jsx`: login, logout e expiração automática da sessão.
- `context/NotificationsContext.jsx`: uma conexão de notificações por sessão; telas usam `useNotificationEvent(tipo, handler)`.
- `hooks/useSocket.js`: WebSocket autenticado com reconexão.
- `lib/session.js`: sessões separadas por papel (Mestre e jogador podem ficar abertos em abas diferentes).
- `services/api.js`: cliente HTTP, `errorMessage()` e `assetUrl()`.
- `components/master/CrudManager.jsx`: base das telas de cadastro do Mestre.

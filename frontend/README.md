# 🎮 RPG System - Frontend

Interface responsiva e moderna para o sistema de RPG.

## 📋 Pré-requisitos

- Node.js 18+ ou pnpm
- npm, yarn ou pnpm instalados

## 🚀 Quick Start

### 1. Instalar dependências

```bash
# Usando npm
npm install

# Ou com yarn
yarn install

# Ou com pnpm
pnpm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` conforme necessário:

```
VITE_API_URL=http://127.0.0.1:8000
VITE_WS_URL=ws://127.0.0.1:8000
```

### 3. Iniciar servidor de desenvolvimento

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

Acesse em `http://localhost:5173`

## 🏗️ Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/           # Componentes reutilizáveis
│   │   ├── player/           # Componentes específicos do Player
│   │   └── master/           # Componentes específicos do Master
│   ├── context/              # React Context para estado global
│   ├── pages/                # Páginas principais
│   ├── services/             # Serviços API e WebSocket
│   ├── utils/                # Utilidades e helpers
│   ├── App.jsx               # Componente raiz
│   ├── main.jsx              # Ponto de entrada
│   └── index.css             # Estilos globais
├── index.html               # HTML principal
├── vite.config.js           # Configuração do Vite
├── tailwind.config.js       # Configuração do Tailwind CSS
└── package.json             # Dependências do projeto
```

## 🎨 Componentes Disponíveis

### Componentes Comuns

- **Button** - Botão reutilizável com múltiplas variantes
- **Card** - Container com estilos padrão
- **Modal** - Diálogo modal personalizável
- **Input** - Campo de entrada com validação
- **StatBar** - Barra de status (HP, Vigor, XP, etc.)
- **Sidebar** - Menu lateral responsivo

### Componentes do Player

- **PlayerCharacter** - Exibição de informações do personagem
- **PlayerInventory** - Gerenciamento de inventário
- **PlayerSkills** - Lista e uso de habilidades
- **PlayerChat** - Chat em tempo real com WebSocket

### Componentes do Master

(Em desenvolvimento)

## 🔐 Autenticação

O sistema usa JWT para autenticação:

1. Usuário faz login via `LoginPage`
2. Token é salvo em `localStorage`
3. O token é incluído automaticamente em todas as requisições
4. Em caso de erro 401, o usuário é redirecionado para login

## 🌐 API Integration

Todas as requisições são feitas via `axios` através do serviço `api.js`:

```javascript
import api from '../../services/api'

// GET
const response = await api.get('/characters')

// POST
await api.post('/characters', data)

// PUT
await api.put(`/characters/${id}`, data)

// DELETE
await api.delete(`/characters/${id}`)
```

##⚡ WebSocket Realtime

O chat usa WebSocket para comunicação em tempo real:

```javascript
import websocket from '../../services/websocket'

// Conectar
await websocket.connect(token, '/ws/chat')

// Enviar mensagem
websocket.send({ message: 'Olá!' })

// Escutar mensagens
websocket.on('message', (data) => {
  console.log(data)
})

// Desconectar
websocket.disconnect()
```

## 🎨 Tema e Cores

**Tema Dark com Laranja**

- Background: `#000` (preto)
- Background secondary: `#1a1a1a` (preto-escuro)
- Primary: `#ff8c00` (laranja)
- Border: `#333`
- Text: `#fff` (branco)
- Text secondary: `#888`

## 📱 Responsividade

A interface é totalmente responsiva:

- **Mobile** - Até 640px (sidebar hamburger)
- **Tablet** - 641px a 1024px
- **Desktop** - 1025px+

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 📦 Dependências Principais

- **React 18.3** - Framework UI
- **React Router 6.20** - Roteamento
- **Axios 1.6** - Cliente HTTP
- **Tailwind CSS 3.4** - Utilitários CSS
- **Vite 5** - Build tool

## 🚀 Deploy

### Build para produção

```bash
npm run build
```

Isto cria uma pasta `/dist` pronta para deploy em servidores estáticos.

### Variáveis de Ambiente em Produção

```
VITE_API_URL=https://api.seu-dominio.com
VITE_WS_URL=wss://api.seu-dominio.com
```

## 🤝 Contribuindo

Para contribuir:

1. Crie uma branch para sua feature
2. Commit suas mudanças
3. Push para a branch
4. Abra um Pull Request

## 📝 Licença

MIT

## 📞 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

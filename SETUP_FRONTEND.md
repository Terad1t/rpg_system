# 🚀 Guia de Instalação Rápido

## Pré-requisitos

Você precisa ter instalado:
- Node.js 18+ (https://nodejs.org/)
- npm, yarn, ou pnpm

## Passo 1: Instalar Dependências

No seu terminal, na pasta `frontend/`:

```bash
# Com npm
npm install

# Com yarn
yarn install

# Com pnpm (mais rápido)
pnpm install
```

> **Se não tem npm/yarn/pnpm instalado**, baixe do site oficial do Node.js que já vem com npm.

## Passo 2: Configurar Variáveis de Ambiente

1. Na pasta `frontend/`, copie o arquivo `.env.example` para `.env.local`
2. (Opcional) Edite os valores se o backend estiver em outro endereço

## Passo 3: Iniciar o Servidor

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

A interface será acessível em: **http://localhost:5173**

## Passo 4: Fazer Login

Use as credenciais padrão:

```
Email: master@rpg.com
Senha: master123
```

Ou crie primeiro um usuário Player via backend.

## 🎮 Explorando a Interface

### Para Player:
- 👤 **Personagem**: Visualiza atributos, HP, Vigor, XP
- 🎒 **Inventário**: Manage items and equipment
- ⚔️ **Habilidades**: Usa skills e vê detalhes
- 💬 **Chat**: Conversa com outros players (em tempo real)

### Para Master:
- 📊 **Dashboard**: Visão geral do sistema (em desenvolvimento)
- 👥 **Jogadores**: Gerenciar players
- 🧙 **Personagens**: CRUD de personagens
- 💎 **Itens**: Gerenciar itens
- ✨ **Habilidades**: Criar/editar skills
- 🗺️ **Mapa**: Regiões, países, vilas

## 🔨 Scripts Disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Cria build para produção
npm run preview  # Visualiza o build localmente
```

## ⚙️ Como Funciona

1. **Frontend** → Faz requisições para o **Backend** (API REST)
2. **Chat** usa **WebSocket** para tempo real
3. **Tokens JWT** são salvos e incluídos automaticamente
4. **Rotas protegidas** baseadas no role do usuário

## 🐛 Troubleshooting

### "npm não encontrado"
- Instale Node.js do site oficial
- Reinicie o terminal

### "Conexão recusada ao backend"
- Certifique-se que o backend está rodando: `uv run uvicorn backend.master.main:app --reload`
- Verifique a URL em `.env.local`

### Componentes não aparecem
- Certifique-se que instalou as dependências: `npm install`
- Limpe o cache: `npm cache clean --force`

## 📚 Próximos Passos

1. Integrar com dados reais do backend
2. Implementar Dashboard do Master
3. Adicionar sistema de batalha
4. Melhorar UX com animações

---

**Dúvidas?** Verifique o arquivo `frontend/README.md` para documentação completa.

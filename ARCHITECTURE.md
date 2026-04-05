# 🎮 Arquitetura RPG System API

## 📋 Visão Geral

A API está dividida em dois módulos principais:
- **Master**: Administrador do jogo (controla dados globais)
- **Player**: Jogadores (modificam apenas seus personagens)

---

## 🏗️ Estrutura de Pastas

```
backend/
├── master/              # Módulo administrativo
│   ├── controllers/     # Rotas do Master
│   ├── models/          # Modelos ORM de todas as entidades
│   ├── services/        # Lógica de negócio
│   ├── schemas/         # Validação Pydantic
│   ├── database/        # Configuração do banco
│   └── main.py          # Aplicação FastAPI principal
│
└── player/              # Módulo do jogador
    ├── controllers/     # Rotas do Player
    └── services/        # Serviços específicos do player
```

---

## 🔐 Permissões e Controle

### Master (Administrador)
**Pode:**
- ✅ Criar, editar e deletar personagens
- ✅ Modificar status (força, velocidade, etc.)
- ✅ Gerenciar itens, habilidades, raças, classes
- ✅ Criar e editar o mapa (regiões, países, vilas)
- ✅ Definir quantidade máxima de itens

**Não pode:**
- ❌ Alterar IDs (imutáveis)

### Player (Jogador)
**Pode:**
- ✅ Editar codinome do personagem
- ✅ Editar descrição/lore do personagem
- ✅ Visualizar seus personagens e dados

**Não pode:**
- ❌ Modificar nome (imutável)
- ❌ Modificar idade (imutável)
- ❌ Modificar raça (imutável)
- ❌ Alterar IDs
- ❌ Acessar personagens de outros players

---

## 🗺️ Modelos de Dados

### Personagens (Characters)
```
- id (imutável)
- name (imutável) - Nome do personagem
- age (imutável) - Idade
- tipo - player, npc, boss
- raca_id (imutável)
- classe_id
- codename - Editável pelo player
- description - Editável pelo player
- user_id - ID do jogador (se for player)
```

### Mapa (Map)
```
Region (Região)
  ├── name
  ├── description
  └── climate (clima)
    └── Country (País)
        ├── name
        ├── description
        ├── image
        └── Village (Vila)
            ├── name
            ├── description
            └── image
```

### Itens
```
- id
- name
- tipo
- description
- image
- quantidade_maxima (Master define, players respeitam)
```

### Habilidades
```
- id
- name
- tipo (classe, raça, item)
- custo_vigor
- custo_vida
- dano_base
- efeitos_atributos
- classe_id (opcional)
- raca_id (opcional)
- item_id (opcional)
```

---

## 📡 Rotas da API

### Master Routes

#### Characters (Master)
```
GET    /characters/              - Listar todos
GET    /characters/{id}          - Obter um
POST   /characters/              - Criar (requer name, age, tipo, raca_id, classe_id)
PUT    /characters/{id}          - Atualizar
DELETE /characters/{id}          - Deletar
```

#### Mapa
```
GET    /regions/                 - Listar regiões
GET    /regions/{id}             - Obter região
POST   /regions/                 - Criar região
PUT    /regions/{id}             - Atualizar região
DELETE /regions/{id}             - Deletar região

GET    /countries/               - Listar países
GET    /countries/{id}           - Obter país
GET    /countries/region/{id}    - Países de uma região
POST   /countries/               - Criar país
PUT    /countries/{id}           - Atualizar país
DELETE /countries/{id}           - Deletar país

GET    /villages/                - Listar vilas
GET    /villages/{id}            - Obter vila
GET    /villages/country/{id}    - Vilas de um país
POST   /villages/                - Criar vila
PUT    /villages/{id}            - Atualizar vila
DELETE /villages/{id}            - Deletar vila
```

#### Habilidades
```
GET    /habilidades/             - Listar habilidades
GET    /habilidades/{id}         - Obter habilidade
POST   /habilidades/             - Criar habilidade
PUT    /habilidades/{id}         - Atualizar habilidade
DELETE /habilidades/{id}         - Deletar habilidade
```

### Player Routes

#### Meus Personagens
```
GET    /my-characters/           - Listar meus personagens
GET    /my-characters/{id}       - Obter meu personagem
PUT    /my-characters/{id}       - Editar codinome/descrição
```

**Header obrigatório**: `X-User-Id: <user_id>`

---

## 🔄 Exemplo de Fluxo

### 1. Master Cria um Personagem
```json
POST /characters/
{
  "name": "Aragorn",
  "age": 87,
  "tipo": "player",
  "raca_id": 1,
  "classe_id": 2,
  "user_id": "user123"
}
```

### 2. Player Edita seu Personagem
```json
PUT /my-characters/1
Header: X-User-Id: user123

{
  "codename": "Rei dos Homens",
  "description": "Grande guerreiro, herdeiro de Isildur"
}
```

### 3. Master Cria Itens com Limite
```json
POST /itens/
{
  "name": "Excalibur",
  "tipo": "weapon",
  "quantidade_maxima": 1
}
```

---

## 🚀 Como Rodar

1. **Instale dependências**: `pip install -e .`
2. **Execute**: `uvicorn backend.master.main:app --reload`
3. **Acesse**: `http://127.0.0.1:8000/docs`

---

## 📝 Notas Importantes

- **User-Id**: Player precisa enviar `X-User-Id` header em todas as requisições
- **Master**: Não tem autenticação por enquanto (implementar JWT futuramente)
- **IDs**: São sempre imutáveis (não podem ser alterados após criação)
- **Quantidade de Itens**: Validação acontece no service

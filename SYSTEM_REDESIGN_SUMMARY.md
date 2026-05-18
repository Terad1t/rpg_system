# 🎮 REDESIGN DO SISTEMA DE RPG
## Sumário Executivo - Visão Geral Completa

**Data**: 2026-05-18  
**Status**: 📋 Documentação Técnica Completa  
**Versão**: 1.0  

---

## 🎯 VISÃO GERAL DA MUDANÇA

### ❌ ANTES (Sistema Atual)
```
Master ──[Edita Status Diretamente]──> Personagem
                 ↓
        Sem validação de progressão
        Sem balanceamento
        Power-leveling possível
```

### ✅ DEPOIS (Novo Sistema)
```
Nível + Raça + Tipo + Equipamentos + Buffs + Pontos Distribuídos
        ↓
Cálculo Automático de Atributos
        ↓
Combate Dinâmico e Balanceado
        ↓
Master controla Buffs/Debuffs apenas
```

---

## 📊 ARQUITETURA DE 6 SPRINTS

```
┌─────────────────────────────────────────────────────────────────┐
│                     ROADMAP 3 MESES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  S1: Distribuição de Pontos ──────► [ 2 semanas ]              │
│      └─ Base: +10 pontos novos                                 │
│                                                                 │
│  S2: Buffs & Debuffs ──────────────► [ 2 semanas ]             │
│      └─ Master cria/aplica efeitos                             │
│                                                                 │
│  S3: Sessões de Fight ─────────────► [ 2 semanas ]             │
│      └─ Notificações, prontidão                                │
│                                                                 │
│  S4: Combate Dinâmico ─────────────► [ 2 semanas ]             │
│      └─ Cartas, turnos, dano calculado                         │
│                                                                 │
│  S5: PvP & Ranking ────────────────► [ 2 semanas ]             │
│      └─ Leaderboard, achievements                              │
│                                                                 │
│  S6: Guilds & Raids ───────────────► [ 2 semanas ]             │
│      └─ Cooperativo e social                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ ESTRUTURA DO SISTEMA

### Sistema de Raças (3 Tipos)

```
┌──────────────────────────────────────────────────────────┐
│                  RAÇAS DO SISTEMA                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  🛡️ BUM - Tank/Resistência                             │
│     ├─ Força ⬆️⬆️⬆️ (+++20%)                            │
│     ├─ Defesa ⬆️⬆️⬆️ (+++25%)                           │
│     ├─ HP ⬆️⬆️⬆️⬆️ (+++30%)                            │
│     └─ Ideal: Frontline, Sobrevivência                 │
│                                                          │
│  🔮 LAID - Mago/Suporte                                 │
│     ├─ Magia ⬆️⬆️⬆️ (+++20%)                            │
│     ├─ Mana ⬆️⬆️⬆️ (+++25%)                             │
│     ├─ Ocultismo ⬆️⬆️⬆️ (+++20%)                        │
│     ├─ Inteligência ⬆️⬆️ (++15%)                        │
│     └─ Ideal: Cura, Controle                           │
│                                                          │
│  ⚡ MAR - Velocista/Dano                                │
│     ├─ Velocidade ⬆️⬆️⬆️ (+++20%)                       │
│     ├─ Dano ⬆️⬆️⬆️ (+++20%)                             │
│     ├─ Agilidade ⬆️⬆️⬆️ (+++20%)                        │
│     └─ Ideal: DPS, Mobilidade                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Fluxo de Evolução

```
┌─ Novo Personagem ─┐
│ free_points = 10  │
└────────┬──────────┘
         │
         ├─ Jogador distribui 10 pontos manualmente
         │  (Ataque [+3], Defesa [+2], Cura [+5])
         │
         ├─ Master aplica Buffs/Debuffs
         │  (Fúria Berserk +50% Força por 3 turnos)
         │
         ├─ Equipamentos modificam
         │  (Espada +200% Força)
         │
         └─ CÁLCULO FINAL:
            Total = (base + distribuído + equipamento) × buff_multiplicador
            Força = (15 + 3 + 20) × 1.5 = 57
```

---

## 🎮 SISTEMA DE COMBATE

### Fluxo da Sessão

```
1️⃣ Master clica "Iniciar Combate"
   ↓
2️⃣ Sistema envia: "Fique Pronto" para todos
   ├─ Contador: 20 segundos
   ├─ Jugadores respondem: [PRONTO] [DECLINAR]
   ↓
3️⃣ Após 20s, Master vê prontidão
   ├─ Aceitos: ✅ 4/4
   ├─ Pode: Iniciar OU Cancelar
   ↓
4️⃣ Combate começa
   ├─ Ordem por Velocidade
   ├─ 7 tipos de ação por turno
   ├─ Dano calculado dinamicamente
   ├─ Chat em tempo real
   ↓
5️⃣ Sessão termina
   ├─ Histórico salvo
   ├─ Ranking atualizado
   ├─ XP/Loot distribuído
   └─ Buffs/Debuffs resetados
```

### Ações Disponíveis (Cartas)

```
┌─────────────────────────────────────────┐
│         7 TIPOS DE CARTAS/AÇÕES         │
├─────────────────────────────────────────┤
│                                         │
│  ⚔️  ATACAR                              │
│      └─ Dano = Força + Técnica         │
│                                         │
│  🛡️  DEFENDER                           │
│      └─ Reduz dano em 50%              │
│                                         │
│  💪  SKILL                              │
│      └─ Habilidade especial             │
│                                         │
│  🎁  ITEM                               │
│      └─ Consumível/Buff                │
│                                         │
│  ✨  MAGIA                              │
│      └─ Dano = Magia + Ocultismo      │
│                                         │
│  💚  CURA                               │
│      └─ Restaura HP                    │
│                                         │
│  ⭐  ESPECIAL                           │
│      └─ Ação única de classe            │
│                                         │
└─────────────────────────────────────────┘
```

### Fórmula de Dano Dinâmico

```
ATAQUE FÍSICO:
└─ dano = (Força + Técnica + pontos_dist) × mult_arma × mult_buff
└─ exemplo: (15 + 5 + 3) × 1.5 × 1.2 = 43.2 → 43

ATAQUE MÁGICO (Laid):
└─ dano = (Magia + Ocultismo + Inteligência) × mult_varinha × mult_buff
└─ exemplo: (20 + 10 + 8) × 2.0 × 1.5 = 84

CRÍTICO:
└─ chance = Agilidade % (máx 50%)
└─ dano_crítico = dano_base × 2.0
```

---

## 📱 MUDANÇAS NO FRONTEND

### Novo Componente: CharacterDevelopTab

```
┌────────────────────────────────────────────┐
│  DESENVOLVIMENTO DO PERSONAGEM             │
├────────────────────────────────────────────┤
│                                            │
│  Pontos Livres Disponíveis: 7 / 10        │
│                                            │
│  ┌─────────────────────┬─────────────────┐│
│  │ FORÇA               │ 15 + 3 = 18     ││
│  │ [────────●─]  [-] [+]                 ││
│  ├─────────────────────┼─────────────────┤│
│  │ DEFESA              │ 12 + 2 = 14     ││
│  │ [─────●──]  [-] [+] │                 ││
│  ├─────────────────────┼─────────────────┤│
│  │ MAGIA               │ 20 + 0 = 20     ││
│  │ [─────────────●] [-][+]               ││
│  │                                        │
│  ... (10 atributos no total)              │
│                                            │
│  Distribuição Atual: Força +3, Defesa +2  │
│  Histórico: Ver alterações anteriores     │
│                                            │
└────────────────────────────────────────────┘
```

### Novo Menu Master: Gerenciar Buffs

```
┌────────────────────────────────────────────┐
│  BUFFS & DEBUFFS (Master Only)             │
├────────────────────────────────────────────┤
│                                            │
│  [CRIAR NOVO BUFF]                         │
│                                            │
│  BUFFS CADASTRADOS:                        │
│  ├─ Fúria Berserk [editar] [deletar]      │
│  │  +50% Força | 3 turnos | Não stackável │
│  │                                        │
│  ├─ Cura Divina [editar] [deletar]        │
│  │  +10% HP/turno | 5 turnos | ×3 stack  │
│  │                                        │
│  └─ Proteção [editar] [deletar]           │
│     +30% Defesa | 4 turnos | Único        │
│                                            │
│  APLICAR A PERSONAGEM:                     │
│  [Selecionar Personagem ▼]                 │
│  [Selecionar Buff ▼]                       │
│  Duração: [3] turnos                       │
│  [APLICAR]                                 │
│                                            │
└────────────────────────────────────────────┘
```

---

## 🗄️ BANCO DE DADOS - RESUMO

### Tabelas Principais

```
characters
├─ id, name, level, free_points ⭐ NOVO
├─ total_points_distributed ⭐ NOVO
└─ race_id, tipo, user_id

character_attributes ⭐ NOVA TABELA
├─ attribute_name (força, magia, etc)
├─ base_value (definido pelo Master)
├─ distributed_points (do jogador) ⭐ NOVO
├─ equipment_bonus
└─ buff_multiplier

race_attributes ⭐ NOVA TABELA
├─ race_id, type (bum/laid/mar)
├─ attribute_name
└─ base_multiplier (1.2 = +20%)

buffs ⭐ NOVA TABELA
├─ name, effects, multiplicadores
├─ stackable, duration

active_effects ⭐ NOVA TABELA
├─ character_id, buff_id
├─ remaining_turns, applied_at

attribute_distribution_log ⭐ NOVA TABELA
├─ character_id, attribute_name
├─ old_value, new_value, distributed_at
└─ (Auditoria completa)

fight_sessions ⭐ NOVA TABELA
├─ participants, status, logs
├─ started_at, finished_at

fight_log ⭐ NOVA TABELA
├─ turn_id, player_id, action
├─ damage_dealt, effects_applied
```

---

## ✅ CRITÉRIO DE SUCESSO

### Sprint 1 (Distribuição de Pontos)
- ✅ Novo personagem nasce com 10 pontos livres
- ✅ Jogador distribui via UI
- ✅ Auditoria registra 100% das operações
- ✅ Zero race conditions
- ✅ Latência < 100ms por ponto

### Sprint 4 (Combate)
- ✅ 4 jogadores podem combater simultaneamente
- ✅ Dano calculado corretamente
- ✅ Histórico completo salvo
- ✅ Chat em tempo real funcionando

### Sprint 6 (Completo)
- ✅ 1000+ usuários simultâneos
- ✅ 99.5% uptime
- ✅ Cobertura de testes > 85%

---

## 📋 PRÓXIMOS PASSOS

### ✅ JÁ FEITO
1. PRD Profissional completo
2. Arquitetura UML e SQL
3. Roadmap com 6 sprints
4. Modelagem de dados
5. Fórmulas de cálculo

### 🔄 PRÓXIMO (Sprint 1)
1. **Backend**: Criar tabelas SQL
2. **Backend**: Implementar schemas Pydantic
3. **Backend**: Endpoints de distribuição
4. **Frontend**: Componente CharacterDevelopTab
5. **Integração**: Conectar com CharacterRequest existente

### 📦 ENTREGÁVEIS
```
c:\Users\Pichau\Downloads\Projetos\rpg_system\
├─ SYSTEM_REDESIGN_SUMMARY.md          ← Você está aqui
├─ SYSTEM_REDESIGN_PRD.md              ← Requisitos detalhados
├─ SYSTEM_REDESIGN_ARCHITECTURE.md     ← UML + SQL
├─ SYSTEM_REDESIGN_ROADMAP.md          ← Timeline
└─ backend/
   ├─ migrations/001_distribution_system.sql
   ├─ models/character_attributes_model.py ⭐ NOVO
   ├─ schemas/character_attributes_schema.py ⭐ NOVO
   └─ services/character_distribution_service.py ⭐ NOVO
```

---

## 🎓 DOCUMENTAÇÃO

Documentação técnica salva em **memory** (session):
- `/memories/session/rpg_system_prd.md` → PRD completo
- `/memories/session/rpg_system_architecture.md` → UML + SQL + Performance
- `/memories/session/rpg_system_roadmap.md` → Timeline + Backlog

---

## 🤝 PRÓXIMA REUNIÃO

**Agenda**:
1. Validar PRD com stakeholders
2. Ajustar fórmulas de dano (balanceamento)
3. Definir equipe por sprint
4. Iniciar Sprint 1

**Duração**: 1 hora  
**Participantes**: Product Owner, Tech Lead, QA Lead  

---

**Documento**: v1.0 | **Data**: 2026-05-18 | **Status**: ✅ Pronto para Aprovação


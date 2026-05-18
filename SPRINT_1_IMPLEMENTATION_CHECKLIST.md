# ✅ SPRINT 1 - IMPLEMENTATION CHECKLIST
## Sistema de Distribuição de Pontos

**Sprint**: 1 de 6  
**Duração**: 2 semanas  
**Prioridade**: 🔴 CRÍTICA  
**Começar**: 2026-05-20  
**Terminar**: 2026-06-02  

---

## 📋 TAREFAS BACKEND

### 1. Banco de Dados (Dia 1-2)

#### 1.1 Criar Migration SQL
- [ ] Arquivo: `alembic/versions/001_character_attributes_system.py`
- [ ] Tabela `character_attributes` (nova, substitui `attributes`)
- [ ] Tabela `race_attributes` (nova, bônus por raça)
- [ ] Tabela `attribute_distribution_log` (auditoria)
- [ ] Modificar `characters` + `free_points`, `total_points_distributed`
- [ ] Criar índices de performance
- [ ] Testes: SQL valida, sem erros de constraint

```sql
-- Checklist SQL
☐ ALTER TABLE characters ADD free_points
☐ ALTER TABLE characters ADD total_points_distributed
☐ CREATE TABLE character_attributes (13 colunas)
☐ CREATE TABLE race_attributes (5 colunas)
☐ CREATE TABLE attribute_distribution_log (7 colunas)
☐ CREATE 8 índices de performance
☐ Verificar: UNIQUE constraints funcionam
☐ Verificar: FOREIGN KEY constraints funcionam
```

#### 1.2 Dados Iniciais
- [ ] Inserir race_attributes para Bum (força 1.2, defesa 1.25, etc)
- [ ] Inserir race_attributes para Laid (magia 1.2, mana 1.25, etc)
- [ ] Inserir race_attributes para Mar (velocidade 1.2, dano 1.2, etc)
- [ ] Verificar multiplicadores estão corretos

```
Bum multipliers:
  strength: 1.20
  defense: 1.25
  hp: 1.30
  energy: 1.15
  ... (remaining 8)

Laid multipliers:
  cura: 1.20
  magia: 1.25
  mana: 1.30
  ocultismo: 1.20
  inteligencia: 1.15
  ... (remaining 8)

Mar multipliers:
  velocidade: 1.20
  dano: 1.20
  agilidade: 1.20
  inteligencia: 1.10
  energy: 1.15
  ... (remaining 8)
```

#### 1.3 Migração de Dados Existentes
- [ ] Script para converter `attributes` → `character_attributes`
- [ ] Script populate `character_attributes.base_value` = valor antigo
- [ ] Script populate `character_attributes.distributed_points = 0`
- [ ] Verificar: Zero personagens perdidos
- [ ] Backup antes de migração

---

### 2. Modelos SQLAlchemy (Dia 2-3)

#### 2.1 CharacterAttribute Model
**Arquivo**: `backend/master/models/character_attribute_model.py` (NOVO)

```python
☐ from_attributes = True em Config
☐ Validar: attribute_name é string 50 chars
☐ Validar: base_value >= 0
☐ Validar: distributed_points >= 0
☐ Validar: buff_multiplier >= 0.0
☐ Relationship com Character (back_populates)
☐ __repr__ para debug
☐ Métodos:
  ☐ calculate_total() → int
  ☐ add_points(n) → int
  ☐ remove_points(n) → int
  ☐ get_max_distributable() → int
```

#### 2.2 RaceAttribute Model
**Arquivo**: `backend/master/models/race_attribute_model.py` (NOVO)

```python
☐ race_id FK → racas
☐ race_type ENUM (bum, laid, mar)
☐ attribute_name string
☐ base_multiplier decimal(3,2)
☐ Relationship com Raca
☐ Método: apply_to_base_value(base: int) → int
```

#### 2.3 AttributeDistributionLog Model
**Arquivo**: `backend/master/models/attribute_distribution_log_model.py` (NOVO)

```python
☐ character_id FK
☐ user_id FK
☐ attribute_name string
☐ old_value, new_value int
☐ operation ENUM (add, remove, reset)
☐ distributed_at timestamp
☐ Índices para queries rápidas
```

#### 2.4 Atualizar Character Model
**Arquivo**: `backend/master/models/character_model.py`

```python
☐ Adicionar: free_points INT DEFAULT 0
☐ Adicionar: total_points_distributed INT DEFAULT 0
☐ Adicionar: relationship("CharacterAttribute")
☐ Adicionar: método get_free_points() → int
☐ Adicionar: método get_total_attribute(name) → int
```

---

### 3. Schemas Pydantic (Dia 3-4)

#### 3.1 Novo arquivo: character_attribute_schema.py

```python
☐ CharacterAttributeRead (leitura):
  ☐ attribute_name: str
  ☐ base_value: int
  ☐ distributed_points: int
  ☐ equipment_bonus: int
  ☐ buff_multiplier: float
  ☐ total_value: int (calculated)
  ☐ max_distributable: int (calculated)

☐ DistributePointRequest (input):
  ☐ character_id: int
  ☐ attribute_name: str (validator: ALLOWED list)
  ☐ points_to_add: int (validator: -1 ou +1)

☐ DistributePointResponse (output):
  ☐ free_points: int
  ☐ attributes: List[CharacterAttributeRead]
  ☐ success: bool
  ☐ message: str

☐ CharacterWithAttributesRead (nova character view):
  ☐ id, name, level, race, type
  ☐ free_points: int
  ☐ total_points_distributed: int
  ☐ attributes: List[CharacterAttributeRead]
```

#### 3.2 Atualizar: character_schema.py

```python
☐ Adicionar CharacterReadWithAttributes para responses
☐ Incluir free_points em CharacterRead
☐ Incluir free_points em CharacterRead output
```

---

### 4. Serviços (Dia 4-5)

#### 4.1 Novo arquivo: character_attribute_service.py

```python
☐ def initialize_character_attributes(db, character_id, race_id, type, base_attrs_dict)
  ☐ Buscar RaceAttribute multipliers
  ☐ Aplicar multiplicadores aos base_attrs
  ☐ Criar CharacterAttribute rows
  ☐ Commit transaction
  ☐ Return List[CharacterAttribute]

☐ def distribute_points(db, character_id, user_id, attr_name, points_to_add)
  ☐ Validação 1: character exists
  ☐ Validação 2: free_points >= abs(points_to_add)
  ☐ Validação 3: new_total <= max_limit
  ☐ Validação 4: user is owner
  ☐ Update character_attributes.distributed_points
  ☐ Update characters.free_points
  ☐ Insert attribute_distribution_log
  ☐ Commit (or rollback on error)
  ☐ Return CharacterAttribute updated

☐ def get_character_attributes(db, character_id) → List[CharacterAttribute]
  ☐ Query joinedload para performance
  ☐ Return ordenado por attribute_name

☐ def get_total_attribute_value(character_attr: CharacterAttribute) → int
  ☐ total = (base + distributed + equipment) * buff
  ☐ Retorna int (truncado)

☐ def validate_distribution(db, character_id, attr_name, new_points) → (bool, str)
  ☐ Retorna (is_valid, error_message)
  ☐ Check free_points >= points_to_add
  ☐ Check max_limit não ultrapassado
  ☐ Check atributo existe
  ☐ Check character não deletado
```

#### 4.2 Atualizar: character_request_services.py

```python
☐ Na função approve_request():
  ☐ Após criar character
  ☐ Chamar initialize_character_attributes()
  ☐ Passar characters.free_points = 10 (NOVO)
  ☐ Passar approval_data com base_attrs
```

---

### 5. Endpoints (Dia 5-6)

#### 5.1 Novo arquivo: character_attribute_controller.py

```python
☐ Router prefix: /api/characters

☐ POST /{character_id}/distribute-points
  ☐ Autenticação: JWT (get_current_player)
  ☐ Body: DistributePointRequest
  ☐ Validação: personagem pertence ao user
  ☐ Chamar: character_attribute_service.distribute_points()
  ☐ Broadcast: WebSocket event (atributo alterado)
  ☐ Return: 200 OK {free_points, attributes}
  ☐ Erro 400: Pontos insuficientes
  ☐ Erro 403: Não é o owner
  ☐ Erro 404: Character não existe

☐ GET /{character_id}/attributes
  ☐ Autenticação: JWT (get_current_player ou master)
  ☐ Return: List[CharacterAttributeRead]
  ☐ Incluir: calculated total_value para cada

☐ GET /{character_id}/distribution-log
  ☐ Autenticação: JWT (get_current_master)
  ☐ Return: List[AttributeDistributionLogRead]
  ☐ Ordenado por data DESC
  ☐ Query params: limit=50, offset=0

☐ POST /{character_id}/reset-points (ADMIN ONLY)
  ☐ Autenticação: JWT + role=="master"
  ☐ Reseta distributed_points = 0
  ☐ Devolve free_points = 10
  ☐ Insert log com operation="reset"
  ☐ Return: 200 OK
```

#### 5.2 Integrar em main.py

```python
☐ from ..controllers import character_attribute_controller
☐ app.include_router(character_attribute_controller.router)
```

---

### 6. Testes Unitários Backend (Dia 6)

#### 6.1 Arquivo: tests/test_character_attribute_service.py

```python
☐ Test: initialize_character_attributes
  ☐ Cria personagem Bum
  ☐ Verifica multiplicadores aplicados
  ☐ Verifica free_points = 10
  ☐ Verifica 13 atributos criados

☐ Test: distribute_points - sucesso
  ☐ Distribui +1 em força
  ☐ free_points decai 9
  ☐ distributed_points = 1
  ☐ Log criado
  ☐ Broadcast enviado

☐ Test: distribute_points - error cases
  ☐ Sem pontos livres → 400
  ☐ Atributo inválido → 400
  ☐ Não é owner → 403
  ☐ Character não existe → 404
  ☐ Ultrapassa max_limit → 400

☐ Test: distribute_points - undo
  ☐ Distribui -1
  ☐ free_points volta ao anterior
  ☐ distributed_points decresce

☐ Test: Race multipliers
  ☐ Bum recebe strength + 20%
  ☐ Laid recebe magia + 25%
  ☐ Mar recebe velocidade + 20%

☐ Test: Total calculation
  ☐ total = (base + distributed + equipment) * buff
  ☐ Valores corretos com múltiplos fatores
```

#### 6.2 Arquivo: tests/test_character_attribute_controller.py

```python
☐ Test: POST distribute-points - 200 OK
  ☐ Request válido
  ☐ Response contém free_points, attributes
  ☐ Status 200

☐ Test: GET attributes - lista completa
  ☐ 13 atributos retornados
  ☐ total_value calculado
  ☐ max_distributable calculado

☐ Test: GET distribution-log - histórico
  ☐ Logs ordenados por date DESC
  ☐ Paginação funciona
  ☐ Master only (403 se player de outro)

☐ Test: POST reset-points - admin only
  ☐ Reset bem-sucedido se master
  ☐ 403 se player comum
  ☐ free_points = 10 após reset
```

---

## 📱 TAREFAS FRONTEND

### 1. Novo Componente (Dia 2-3)

#### 1.1 Arquivo: src/components/player/CharacterDevelopTab.jsx

```jsx
☐ Component exports default CharacterDevelopTab
☐ Props: character, onPointsDistributed(callback)
☐ State:
  ☐ attributes: List
  ☐ freePoints: int
  ☐ loading: bool
  ☐ error: string
  ☐ history: List (opcional v2)

☐ useEffect: fetch attributes on mount
  ☐ GET /api/characters/{character_id}/attributes
  ☐ Setar state
  ☐ Handle errors

☐ Handler: handleAddPoint(attrName)
  ☐ Validação: freePoints > 0
  ☐ POST /api/characters/{id}/distribute-points
  ☐ Body: {attribute_name, points_to_add: 1}
  ☐ On success: update local state
  ☐ On error: mostrar toast
  ☐ Disable button durante request

☐ Handler: handleRemovePoint(attrName) (undo)
  ☐ POST com points_to_add: -1
  ☐ Same validations

☐ Render:
  ☐ Card "Pontos Livres: {X}/10"
  ☐ Lista 13 atributos em 2 colunas (grid)
  ☐ Cada atributo:
    ☐ Nome
    ☐ Valor base
    ☐ Pontos distribuídos
    ☐ Valor total = (base + dist + equip) * buff
    ☐ Botão [-]
    ☐ Botão [+]
    ☐ Barra visual (0-100%)
    ☐ Tooltip: "Clique para distribuir pontos"
  ☐ Spinner enquanto loading
  ☐ Error message se falha
  ☐ "Todos pontos distribuídos ✅" quando free_points = 0

☐ Responsive:
  ☐ 1 coluna em mobile
  ☐ 2 colunas em tablet
  ☐ 2 colunas em desktop
```

#### 1.2 Arquivo: src/components/player/CharacterDevelopTab.test.jsx

```jsx
☐ Test: renders component
☐ Test: loads attributes on mount
☐ Test: distribute points success
☐ Test: shows error on distribute fail
☐ Test: disable [+] when no free points
☐ Test: undo with [-]
☐ Test: responsive layout
☐ Test: total value calculated correctly
☐ Coverage: > 85%
```

---

### 2. Integração em Componentes Existentes (Dia 3-4)

#### 2.1 Modificar: src/components/player/PlayerCharacter.jsx

```jsx
☐ Adicionar aba "Desenvolver" em tabs
☐ Import CharacterDevelopTab
☐ Render <CharacterDevelopTab /> quando aba selected
☐ Passar props: character, onPointsDistributed

☐ Tabs order (novo):
  1. Ficha (INFO)
  2. Inventário
  3. Habilidades
  4. Desenvolver ← NOVO
  5. Combate (futuro)
```

#### 2.2 Modificar: src/pages/PlayerDashboard.jsx

```jsx
☐ Atualizar header quando pontos distribuídos
☐ Mostrar: "Pontos Livres: 8/10" em card pequeno
☐ Listener WebSocket para updates (futuro)
```

---

### 3. Integração com CharacterRequests (Dia 4-5)

#### 3.1 Verificar: src/pages/CharacterRequests.jsx

```jsx
☐ Já adicionado anteriormente (Sprint anterior)
☐ Verificar que CharacterApproval inclui:
  ☐ hp, vigor, agility, speed, charisma, intellect
  ☐ investigation, presence, occultism
  ☐ subclass (opcional)
☐ Não precisa de mudanças nesta sprint
☐ Nota: free_points será set automaticamente
```

---

### 4. Testes E2E Frontend (Dia 5-6)

#### 4.1 Arquivo: src/pages/CharacterDevelop.test.jsx

```jsx
☐ Test E2E: Novo personagem → Distribuir pontos
  ☐ Load personagem com free_points=10
  ☐ Clica [+] em Força 3 vezes
  ☐ free_points = 7
  ☐ Força distributed_points = 3
  ☐ Clica [-] 1 vez
  ☐ free_points = 8
  ☐ Força distributed_points = 2
  ☐ Refresh página
  ☐ Pontos persistem

☐ Test E2E: Validações
  ☐ Sem internet → mostra erro
  ☐ 401 unauthorized → login redirect
  ☐ 403 forbidden → error message
  ☐ 404 character → error message
```

---

## 🔗 INTEGRAÇÃO COM CÓDIGO EXISTENTE

### 1. CharacterRequest Existente
```
character_request_controller.py ← APPROVE endpoint
        ↓ (ao aprovar)
character_request_services.py (approve_request)
        ↓
character_attribute_service.py ← NOVO (initialize)
```

**Modificação**:
```python
# Em approve_request()
character = Character(...)
db.add(character)
db.commit()

# NOVO - Inicializar atributos
from ..services.character_attribute_service import initialize_character_attributes
initialize_character_attributes(
    db=db,
    character_id=character.id,
    race_id=character.raca_id,
    race_type=approval_data.get('subclass'),  # será o tipo
    base_attrs_dict=approval_data  # hp, vigor, etc.
)

character.free_points = 10  # NOVO
db.commit()
```

### 2. WebSocket Broadcast (Futuro)
```python
# character_attribute_controller.py
event = CharacterUpdateEvent(data={
    "action": "attribute_distributed",
    "character_id": character_id,
    "attribute_name": attr_name,
    "new_free_points": free_points
})
await broadcast_manager.broadcast(event)
```

---

## 📊 TESTES E VALIDAÇÃO

### Cobertura de Testes Mínima
```
Backend:
  ☐ Services: 90%+ cobertura
  ☐ Controllers: 85%+ cobertura
  ☐ Models: 95%+ cobertura
  ☐ Total: 85%+

Frontend:
  ☐ Components: 80%+ cobertura
  ☐ Hooks: 85%+ cobertura
  ☐ Total: 80%+
```

### Performance
```
☐ POST distribute-points: < 200ms
☐ GET attributes: < 100ms
☐ GET distribution-log: < 150ms
☐ Database query: < 50ms
```

### Segurança
```
☐ Autenticação em todos endpoints
☐ Validação de ownership
☐ SQL injection protected (ORM)
☐ Rate limiting (futuro)
☐ Auditoria completa
```

---

## 📝 DOCUMENTAÇÃO

### Código
```
☐ Docstrings em todas funções (English)
☐ Type hints completos
☐ Comments em lógica complexa
☐ README.md atualizado
```

### API
```
☐ Swagger/OpenAPI atualizado
☐ Exemplos de request/response
☐ Error codes documentados
☐ Rate limits documentados
```

### Setup
```
☐ Migration instructions
☐ Rollback instructions
☐ Database backup procedures
☐ Testing guide (local setup)
```

---

## ✅ CHECKLIST DE ENTREGA

### Backend
- [ ] 3 tabelas criadas com índices
- [ ] 4 modelos SQLAlchemy
- [ ] 4 schemas Pydantic
- [ ] 1 serviço completo (character_attribute_service)
- [ ] 3+ endpoints
- [ ] 20+ testes unitários
- [ ] 0 bugs críticos
- [ ] Cobertura > 85%
- [ ] Performance validada

### Frontend
- [ ] 1 novo componente (CharacterDevelopTab)
- [ ] Integração em 2 componentes existentes
- [ ] 10+ testes
- [ ] Responsivo (mobile/tablet/desktop)
- [ ] Acessibilidade básica
- [ ] 0 console errors/warnings

### Integração
- [ ] CharacterRequest aprovação cria pontos
- [ ] UI atualiza em real-time
- [ ] Dados persistem após reload
- [ ] E2E tests passam

### Documentação
- [ ] PRD atualizado (se houver mudanças)
- [ ] API docs atualizado
- [ ] Code comments completos
- [ ] Setup instructions claros

---

## 📋 DAILY STATUS

### Dia 1-2: DB & Models
- [ ] Segunda: SQL migration completa
- [ ] Terça: Models SQLAlchemy + tests

### Dia 3: Schemas & Services
- [ ] Quarta: Schemas Pydantic
- [ ] Quinta: Services completo + tests

### Dia 4: Controllers & Integration
- [ ] Sexta: Endpoints completos
- [ ] Segunda: Testes de integração

### Dia 5-6: Frontend & E2E
- [ ] Terça: Componente React + tests
- [ ] Quarta: Integração
- [ ] Quinta: E2E tests + bug fixes

### Dia 7-10: QA & Deployment
- [ ] Sexta: Code review
- [ ] Segunda: Bug fixes
- [ ] Terça: Performance tests
- [ ] Quarta: Deployment staging
- [ ] Quinta: Deploy produção

---

## 🚀 DEPLOYMENT

### Checklist Pre-Deploy
```
☐ Todos testes passando
☐ Code review aprovado
☐ Database backup feito
☐ Migration testada em staging
☐ Rollback plan documentado
☐ Monitoring ativado
☐ Notificação ao time
```

### Rollback Plan
```
Se problema em produção:
☐ Revert migration (alembic downgrade)
☐ Restore backup
☐ Redeploy versão anterior
☐ Notify stakeholders
```

---

**Versão**: 1.0  
**Criado**: 2026-05-18  
**Próxima Revisão**: 2026-05-25 (Final Sprint 1)  

**Status**: ✅ Pronto para Iniciar  


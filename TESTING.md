# Guia de Testes - RPG System

Este documento descreve como executar e escrever testes para a parte de player do RPG System.

## 📋 Índice

1. [Testes do Backend](#testes-do-backend)
2. [Testes do Frontend](#testes-do-frontend)
3. [Executar Todos os Testes](#executar-todos-os-testes)
4. [Escrever Novos Testes](#escrever-novos-testes)

---

## Testes do Backend

### Instalação de Dependências

As dependências de teste já foram adicionadas ao `pyproject.toml`. Instale com:

```bash
pip install -e ".[test]"
```

Ou se estiver usando `uv`:

```bash
uv pip install -e ".[test]"
```

### Estrutura dos Testes

O arquivo `test_player_character.py` contém testes para:

- **Services**: `get_player_character`, `update_player_character`, `get_all_player_characters`
- **Controllers**: Endpoints da API REST
- **Integração**: Fluxos completos de autenticação e autorização

### Executar Testes Backend

#### Executar todos os testes:
```bash
pytest
```

#### Executar com saída detalhada:
```bash
pytest -v
```

#### Executar arquivo específico:
```bash
pytest test_player_character.py -v
```

#### Executar teste específico:
```bash
pytest test_player_character.py::TestPlayerCharacterServices::test_get_player_character_success -v
```

#### Executar com cobertura de código:
```bash
pytest --cov=backend.player --cov-report=html
```

Isso gera um relatório HTML em `htmlcov/index.html`

#### Executar apenas tests com palavra-chave:
```bash
pytest -k "update" -v
```

### Estrutura de Testes Backend

#### 1. **TestPlayerCharacterServices** (Testes Unitários)

Testam os services isoladamente:

```python
def test_get_player_character_success(self, db_session, sample_character):
    """Testa obtenção bem-sucedida de um personagem do player"""
    character = get_player_character(db_session, character_id=1, user_id="user_123")
    assert character is not None
    assert character.id == 1
```

**Testes inclusos:**
- `test_get_player_character_success` - Obtenção bem-sucedida
- `test_get_player_character_unauthorized` - Erro de autorização
- `test_get_player_character_not_found` - Personagem não encontrado
- `test_get_all_player_characters` - Listar todos os personagens
- `test_update_player_character_codename` - Atualizar codinome
- `test_update_player_character_description` - Atualizar descrição
- `test_update_player_character_both_fields` - Atualizar ambos
- `test_update_player_character_unauthorized` - Erro ao atualizar

#### 2. **TestPlayerCharacterController** (Testes de Integração)

Testam os endpoints HTTP:

```python
def test_get_my_characters_success(self, client, sample_character):
    """Testa obtenção de personagens com user_id válido"""
    response = client.get(
        "/my-characters/",
        headers={"x-user-id": "user_123"}
    )
    assert response.status_code == 200
```

**Testes inclusos:**
- `test_get_my_characters_success` - GET /my-characters/
- `test_get_my_characters_no_characters` - Sem personagens (404)
- `test_get_my_character_by_id_success` - GET /my-characters/{id}
- `test_get_my_character_by_id_unauthorized` - Sem permissão (403)
- `test_update_my_character_success` - PUT /my-characters/{id}
- `test_update_my_character_partial` - Atualização parcial
- `test_update_my_character_unauthorized` - Erro ao atualizar

### Fixtures de Teste

O arquivo define fixtures reutilizáveis:

```python
@pytest.fixture(scope="function")
def db_session():
    """Cria um banco SQLite em memória para testes"""

@pytest.fixture(scope="function")
def client(db_session):
    """Cria um cliente de teste FastAPI"""

@pytest.fixture(scope="function")
def sample_character(db_session):
    """Cria um personagem de teste"""
```

---

## Testes do Frontend

### Instalação de Dependências

Instale as dependências do frontend:

```bash
cd frontend
npm install
```

### Estrutura dos Testes

O arquivo `src/components/player/PlayerCharacter.test.jsx` testa:

- Renderização correta do componente
- Exibição de dados de personagem
- Cálculo de modificadores de atributo
- Casos extremos (valores mínimos/máximos)

### Executar Testes Frontend

#### Executar todos os testes:
```bash
cd frontend
npm test
```

#### Executar em modo watch (reinicia ao salvar):
```bash
npm test -- --watch
```

#### Executar com UI interativa:
```bash
npm run test:ui
```

#### Gerar relatório de cobertura:
```bash
npm run test:coverage
```

#### Executar teste específico:
```bash
npm test -- PlayerCharacter.test.jsx
```

### Estrutura de Testes Frontend

#### 1. Renderização Básica

```javascript
it('deve renderizar o componente com dados corretos', () => {
  render(<PlayerCharacter character={mockCharacter} />)
  
  expect(screen.getByText('Aragorn')).toBeInTheDocument()
  expect(screen.getByText('Humano')).toBeInTheDocument()
})
```

#### 2. Cálculos

```javascript
it('deve calcular corretamente XP faltando para próximo nível', () => {
  render(<PlayerCharacter character={mockCharacter} />)
  expect(screen.getByText('1500 XP para próximo nível')).toBeInTheDocument()
})
```

#### 3. Casos Extremos

```javascript
it('deve renderizar com atributos máximos', () => {
  const character = {
    ...mockCharacter,
    attributes: { strength: 25, ... }
  }
  render(<PlayerCharacter character={character} />)
  expect(screen.getByText('Lendário')).toBeInTheDocument()
})
```

---

## Executar Todos os Testes

### De uma vez (Backend + Frontend)

```bash
# 1. Executar testes do backend
pytest -v

# 2. Executar testes do frontend
cd frontend && npm test
```

Ou criar um script que execute ambos:

```bash
# Para Windows (PowerShell)
pytest -v; cd frontend; npm test

# Para Unix/Linux
pytest -v && cd frontend && npm test
```

---

## Escrever Novos Testes

### Template: Backend (Python)

```python
def test_nova_funcionalidade(self, db_session, sample_character):
    """Descrição clara do que está sendo testado"""
    # Arrange
    resultado_esperado = "algo"
    
    # Act
    resultado = minha_funcao(db_session, param="valor")
    
    # Assert
    assert resultado == resultado_esperado
```

### Template: Frontend (JavaScript)

```javascript
it('deve fazer algo específico', () => {
  // Arrange
  const character = { ...mockCharacter, name: 'Test' }
  
  // Act
  render(<PlayerCharacter character={character} />)
  
  // Assert
  expect(screen.getByText('Test')).toBeInTheDocument()
})
```

### Boas Práticas

✅ **Faça:**
- Um teste por funcionalidade
- Nomes descritivos em português
- Testar casos de sucesso E erro
- Usar fixtures/mocks para dados

❌ **Evite:**
- Testar múltiplas coisas em um teste
- Testes interdependentes
- Dados hardcoded sem explicação
- Testes que passam por acaso

---

## Entendendo as Falhas

### Backend

Se um teste falha, você verá:

```
FAILED test_player_character.py::TestPlayerCharacterServices::test_get_player_character_success
AssertionError: assert None == Character(...)
```

**O que fazer:**
1. Leia a mensagem de erro
2. Execute novamente com `-vv` para mais detalhes
3. Verá qual assert falhou

### Frontend

Vitest fornece mensagens amigáveis:

```
✓ deve renderizar o componente (12ms)
✗ deve calcular XP corretamente
  Expected: "1500 XP para próximo nível"
  Got: "1600 XP para próximo nível"
```

---

## Variáveis de Teste

### Backend - `sample_character`

```python
{
    "id": 1,
    "name": "Aragorn",
    "age": 30,
    "tipo": "player",
    "raca_id": 1,
    "classe_id": 1,
    "codename": "O Montador",
    "description": "Um guerreiro nobre",
    "user_id": "user_123"
}
```

### Frontend - `mockCharacter`

```javascript
{
  id: 1,
  name: 'Aragorn',
  race: 'Humano',
  class: 'Guerreiro',
  level: 15,
  hp: 80,
  maxHp: 100,
  // ... mais atributos
}
```

---

## Troubleshooting

### Backend

**Erro: "ModuleNotFoundError: No module named 'pytest'"**
```bash
pip install -e ".[test]"
```

**Erro: Database is locked**
- Os testes usam SQLite em memória, isso é raro
- Tente reseta o ambiente: `pytest --cache-clear`

**Erro: "No characters found" mas deveria encontrar**
- Verifique se o `user_id` nos testes corresponde ao do `sample_character`

### Frontend

**Erro: "Cannot find module '@testing-library/react'"**
```bash
npm install
```

**Erro: "vitest is not recognized"**
```bash
npx vitest
```

**Componente não renderiza nos testes**
- Verifique se all props obrigatórias estão no `mockCharacter`
- Certifique-se que imports estão corretos

---

## Links Uteis

- [Pytest Documentation](https://docs.pytest.org/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [FastAPI Testing](https://fastapi.tiangolo.com/advanced/testing-dependencies/)

---

**Última atualização:** Abril 2026

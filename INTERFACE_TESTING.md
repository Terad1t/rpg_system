# Testes de Interface - Guia Prático

Este documento descreve como testar a interface interativa, preencher formulários e validar se dados estão sendo enviados para a API.

## 📋 Índice

1. [Setup Inicial](#setup-inicial)
2. [Testes de Interfaces Interativas](#testes-de-interfaces-interativas)
3. [Testar Envio de Dados](#testar-envio-de-dados)
4. [Mock de API](#mock-de-api)
5. [Executar e Depurar](#executar-e-depurar)

---

## Setup Inicial

### Instalar Dependências

```bash
cd frontend
npm install
```

Isso instalará:
- `vitest` - Framework de testes
- `@testing-library/react` - Biblioteca para testar React
- `@testing-library/user-event` - Simular interações de usuário
- `@vitest/ui` - UI interativa para rodar testes

### Arquivos de Teste Criados

```
frontend/
├── src/
│   └── components/
│       └── player/
│           ├── PlayerCharacterEditor.jsx      (novo componente)
│           ├── PlayerCharacterEditor.test.jsx (testes de interface)
│           └── PlayerCharacter.test.jsx       (testes de exibição)
└── vitest.config.js
```

---

## Testes de Interfaces Interativas

O arquivo `PlayerCharacterEditor.test.jsx` testa:

### 1️⃣ Renderização de Campos

```javascript
it('deve renderizar o formulário com campos de edição', () => {
  render(<PlayerCharacterEditor character={mockCharacter} />)
  
  expect(screen.getByLabelText('Codinome')).toBeInTheDocument()
  expect(screen.getByLabelText('Descrição')).toBeInTheDocument()
})
```

**O que valida:**
- Campo de codinome está visível
- Campo de descrição está visível
- Todos os labels aparecem

### 2️⃣ Preenchimento de Campos

```javascript
it('deve atualizar o valor do codinome ao digitar', async () => {
  const user = userEvent.setup()
  render(<PlayerCharacterEditor character={mockCharacter} />)
  
  const codenameInput = screen.getByLabelText('Codinome')
  await user.clear(codenameInput)
  await user.type(codenameInput, 'Novo Codinome')
  
  expect(codenameInput.value).toBe('Novo Codinome')
})
```

**O que valida:**
- ✅ Você consegue limpar um campo
- ✅ Você consegue digitar novo texto
- ✅ O valor do campo é atualizado em tempo real

### 3️⃣ Contadores de Caracteres

```javascript
it('deve exibir contador de caracteres', () => {
  render(<PlayerCharacterEditor character={mockCharacter} />)
  
  expect(screen.getByText('11/100')).toBeInTheDocument() // "O Montador"
  expect(screen.getByText('17/500')).toBeInTheDocument() // "Um guerreiro nobre"
})
```

**O que valida:**
- Os contadores aparecem
- Os contadores refletem o comprimento correto

---

## Testar Envio de Dados

### Como Funciona o Mock de API

O teste "simula" a API do backend usando `vi.mock()`:

```javascript
vi.mock('../../services/api', () => ({
  default: {
    put: vi.fn(), // Simula chamada PUT
  },
}))
```

Isso significa que quando seu componente chama `api.put()`, o teste **intercepta** a chamada e pode:
- Verificar quais dados foram enviados
- Simular resposta de sucesso
- Simular erro

### Teste Básico de Envio

```javascript
it('deve chamar API com dados corretos ao submeter formulário', async () => {
  const user = userEvent.setup()
  
  // Configurar o mock para simular sucesso
  apiModule.default.put.mockResolvedValueOnce({
    data: mockCharacter
  })
  
  render(<PlayerCharacterEditor character={mockCharacter} />)
  
  // Modificar o codinome
  const codenameInput = screen.getByLabelText('Codinome')
  await user.clear(codenameInput)
  await user.type(codenameInput, 'Elessar')
  
  // Clicar em salvar
  const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
  await user.click(submitButton)
  
  // VERIFICAR: A API foi chamada com os dados corretos?
  await waitFor(() => {
    expect(apiModule.default.put).toHaveBeenCalledWith(
      '/player/my-characters/1',  // URL correta
      {
        codename: 'Elessar',      // Dados enviados
        description: 'Um guerreiro nobre',
      }
    )
  })
})
```

**Passo a passo:**
1. ✅ Simular sucesso da API
2. ✅ Render do componente
3. ✅ Preencher o formulário
4. ✅ Clicar em salvar
5. ✅ Verificar se `api.put()` foi chamado corretamente

### Verificar Dados Enviados

Para confirmar que seus dados estão "subindo" (sendo enviados):

```javascript
// O mock registra os argumentos
expect(apiModule.default.put).toHaveBeenCalledWith(
  '/player/my-characters/1',  // ← Este é o endpoint
  {                            // ← Estes são os dados
    codename: 'Elessar',
    description: 'Um guerreiro nobre',
  }
)
```

Se o teste passar, você pode ter **100% de certeza** que:
- A URL está correta
- Os dados estão sendo formatados corretamente
- Os campos certos estão sendo enviados

---

## Mock de API

### Simular Sucesso

```javascript
apiModule.default.put.mockResolvedValueOnce({
  data: { ...mockCharacter, codename: 'Novo Nome' }
})
```

### Simular Erro

```javascript
apiModule.default.put.mockRejectedValueOnce({
  response: {
    data: {
      detail: 'Você não tem permissão para editar este personagem'
    }
  }
})
```

### Verificar Mensagens de Erro

```javascript
it('deve exibir erro ao falhar', async () => {
  const user = userEvent.setup()
  
  apiModule.default.put.mockRejectedValueOnce({
    response: {
      data: { detail: 'Erro ao salvar' }
    }
  })
  
  render(<PlayerCharacterEditor character={mockCharacter} />)
  
  const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
  await user.click(submitButton)
  
  // Verificar se a mensagem de erro aparece
  await waitFor(() => {
    expect(screen.getByText('Erro ao salvar')).toBeInTheDocument()
  })
})
```

---

## Executar e Depurar

### Rodar Testes de Frontend

```bash
cd frontend

# Rodar testes em modo normal
npm test

# Rodar apenas testes do PlayerCharacterEditor
npm test -- PlayerCharacterEditor.test.jsx

# Modo watch (reinicia ao salvar)
npm test -- --watch

# UI interativa
npm run test:ui

# Cobertura de código
npm run test:coverage
```

### UI Interativa (Recomendado! 🎯)

```bash
npm run test:ui
```

Isso abre uma interface visual onde você pode:
- ✅ Ver todos os testes rodando
- ✅ Clicar para rodar testes específicos
- ✅ Ver erros em tempo real
- ✅ Filtar testes
- ✅ Modo debug

### Depurar um Teste Específico

No arquivo `.test.jsx`, adicione `.only` para rodar apenas um teste:

```javascript
it.only('deve chamar API com dados corretos', async () => {
  // ... seu código de teste
})
```

Depois rode:

```bash
npm test -- --watch
```

Assim apenas esse teste rodará e você pode ver logs detalhados!

### Ver Logs de Debug

No seu teste, use `screen.debug()`:

```javascript
it('meu teste', async () => {
  const user = userEvent.setup()
  render(<PlayerCharacterEditor character={mockCharacter} />)
  
  // Mostrar o HTML renderizado
  screen.debug()
  
  // Mostrar apenas um elemento
  const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
  screen.debug(submitButton)
})
```

---

## Exemplos Práticos

### Exemplo 1: Validar Contador de Caracteres

```javascript
it('deve atualizar contador ao digitar', async () => {
  const user = userEvent.setup()
  render(<PlayerCharacterEditor character={mockCharacter} />)
  
  const codenameInput = screen.getByLabelText('Codinome')
  
  // Começa com 11 caracteres
  expect(screen.getByText('11/100')).toBeInTheDocument()
  
  // Adicionar mais texto
  await user.type(codenameInput, ' - Rei')  // Adiciona " - Rei"
  
  // Agora deve ter 17 caracteres
  expect(screen.getByText('17/100')).toBeInTheDocument()
})
```

### Exemplo 2: Verificar Botão Desabilitado Durante Carregamento

```javascript
it('deve desabilitar botão durante envio', async () => {
  const user = userEvent.setup()
  
  let resolve
  apiModule.default.put.mockReturnValueOnce(
    new Promise(r => { resolve = r })
  )
  
  render(<PlayerCharacterEditor character={mockCharacter} />)
  
  const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
  
  // Clicar
  await user.click(submitButton)
  
  // Enquanto carregando, mostrar "Salvando..." e desabilitar
  expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
  
  // Simular resposta da API
  resolve({ data: mockCharacter })
  
  // Depois, voltar ao normal
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Salvar Alterações' })).not.toBeDisabled()
  })
})
```

### Exemplo 3: Testar Validação

```javascript
it('deve validar limite de caracteres', async () => {
  const user = userEvent.setup()
  render(<PlayerCharacterEditor character={mockCharacter} />)
  
  const codenameInput = screen.getByLabelText('Codinome')
  
  // Tentar digitar 101 caracteres
  await user.clear(codenameInput)
  await user.type(codenameInput, 'a'.repeat(101))
  
  // Input maxLength protege (máximo 100)
  expect(codenameInput.value).toHaveLength(100)
  
  // Clicar em salvar
  const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
  await user.click(submitButton)
  
  // Mensagem de erro deve aparecer
  await waitFor(() => {
    expect(
      screen.getByText('Codinome não pode ter mais de 100 caracteres')
    ).toBeInTheDocument()
  })
})
```

---

## Comparação: Teste vs. Realidade

| O que você testa | Como funciona |
|---|---|
| **Renderização** | Verifica se elementos HTML aparecem |
| **Preenchimento** | Simula digitação em campos |
| **Envio de dados** | Intercepta chamada HTTP e verifica argumentos |
| **Resposta da API** | Mock simula sucesso ou erro |
| **Mensagens** | Verifica se sucesso/erro aparece na tela |

---

## Checklist de Testes

Antes de considerar sua feature pronta, verifique:

- [ ] ✅ Todos os campos renderizam corretamente
- [ ] ✅ Você consegue preencher campos
- [ ] ✅ Input respeita limite de caracteres
- [ ] ✅ Contador de caracteres funciona
- [ ] ✅ Botão "Salvar" está ativo
- [ ] ✅ Botão "Cancelar" limpa o formulário
- [ ] ✅ API é chamada com dados corretos
- [ ] ✅ Mensagem de sucesso aparece
- [ ] ✅ Mensagem de erro aparece se falhar
- [ ] ✅ Formulário fica desabilitado durante envio
- [ ] ✅ Botões voltam ao normal após resposta

---

## Troubleshooting

### Teste falha com "Cannot find module"

```bash
npm install
```

### "@testing-library/user-event is not exported"

Certifique-se que está usando:

```javascript
import userEvent from '@testing-library/user-event'
```

### Mock não está funcionando

Certifique-se que está antes do render:

```javascript
// ✅ Correto
apiModule.default.put.mockResolvedValueOnce({ data })
render(<Component />)

// ❌ Errado
render(<Component />)
apiModule.default.put.mockResolvedValueOnce({ data })
```

### Teste passa mas está lento

Considere usar `userEvent` em vez de `fireEvent`:

```javascript
// ✅ Mais realista (recomendado)
const user = userEvent.setup()
await user.type(input, 'texto')

// ❌ Mais rápido mas menos realista
fireEvent.change(input, { target: { value: 'texto' } })
```

---

## Links Úteis

- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [User Event Docs](https://testing-library.com/docs/user-event/intro)
- [Vitest Docs](https://vitest.dev/)
- [Jest Matchers](https://vitest.dev/api/expect.html)

---

**Última atualização:** Abril 2026

**Dica:** Use `npm run test:ui` para melhor experiência! 🚀

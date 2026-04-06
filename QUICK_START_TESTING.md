# Quick Start - Testa Sua Interface em 5 Minutos ⚡

## Passo 1: Instalar Dependências

```bash
cd frontend
npm install
```

**Espere enviar mais de 300 pacotes... ☕**

---

## Passo 2: Abrir a UI de Testes

```bash
npm run test:ui
```

**Resultado:** Uma janela do navegador abre automaticamente com interface visual 🎨

---

## Passo 3: Ver Testes Rodando

A interface mostra:
- ✅ Testes **PASSANDO** (verde)
- ❌ Testes **FALHANDO** (vermelho)
- ⏳ Testes **RODANDO** (azul)

---

## Passo 4: Entender o Que Está Sendo Testado

### Tests do `PlayerCharacterEditor.test.jsx`

**Renderização:**
- Campos de codinome e descrição aparecem?
- Dados do personagem (imutáveis) mostram?

**Interação:**
- Você consegue digitar nos campos?
- Contador de caracteres funciona?
- Botões funcionam?

**Envio de Dados:**
- API é chamada com dados corretos?
- Mensagem de sucesso/erro aparece?
- Botão fica "Salvando..." durante requisição?

**Validação:**
- Campo respeita limite de 100 caracteres?
- Campo de descrição respeita 500 caracteres?

---

## Passo 5: Testar Manualmente na Aplicação

Se quiser testar **de verdade** (sem mock), faça isso:

### 1. Iniciar o backend

```bash
cd rpg_system
python -m backend.master.main
```

### 2. Em outro terminal, iniciar o frontend

```bash
cd rpg_system/frontend
npm run dev
```

### 3. Abrir em navegador

Acesse: `http://localhost:5173`

---

## Entender o Que Cada Teste Faz

### 📄 PlayerCharacterEditor.test.jsx

Simula um usuário:

```
1. Abrir a interface
   ↓
2. Ver campos de edição (Codinome, Descrição)
   ↓
3. Preencher os campos
   ↓
4. Clicar em "Salvar Alterações"
   ↓
5. VERIFICAR: Dados foram enviados para API?
   ↓
6. VERIFICAR: Mensagem de sucesso apareceu?
```

**Exemplo prático do teste:**

```javascript
// 1. Configurar API para simular sucesso
apiModule.default.put.mockResolvedValueOnce({
  data: mockCharacter
})

// 2. Renderizar componente
render(<PlayerCharacterEditor character={mockCharacter} />)

// 3. Preencher campo
const codenameInput = screen.getByLabelText('Codinome')
await user.clear(codenameInput)
await user.type(codenameInput, 'Novo Codinome')

// 4. Clicar em salvar
const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
await user.click(submitButton)

// 5. VERIFICAR: API foi chamada corretamente?
expect(apiModule.default.put).toHaveBeenCalledWith(
  '/player/my-characters/1',
  {
    codename: 'Novo Codinome',
    description: 'Um guerreiro nobre',
  }
)

// 6. VERIFICAR: Mensagem de sucesso apareceu?
expect(screen.getByText('Personagem atualizado com sucesso!')).toBeInTheDocument()
```

---

## Casos de Teste Inclusos

### ✅ Renderização e Layout
- Formulário renderiza com campos corretos
- Dados imutáveis aparecem (nome, raça, classe, nível)
- Contadores de caracteres funcionam
- Botões aparecem

### ✅ Interação com Campos
- Digitar atualiza o valor
- Limite de caracteres é respeitado
- Botão Cancelar limpa formulário
- Mensagens de erro limpam ao digitar

### ✅ Validação
- Codinome com mais de 100 caracteres = erro
- Descrição com mais de 500 caracteres = erro
- Campos vazios são permitidos = OK

### ✅ Envio para API
- URL está correta: `/player/my-characters/{id}`
- Dados são formatados corretamente
- Campos null quando vazios
- Callback `onUpdate` é chamado

### ✅ Tratamento de Erros
- Erro do servidor aparece na tela
- Usuário consegue corrigir e tentar novamente
- Botões voltam ao normal após erro

### ✅ Casos Extremos
- Caracteres especiais funcionam (🐉 @#$%)
- Quebras de linha funcionam
- Campos vazios funcionam

---

## Checklist: Seu Formulário Está Pronto Quando...

- [ ] Todos os testes passam em `npm test`
- [ ] A interface visual abre com `npm run test:ui`
- [ ] Você consegue digitar em todos os campos
- [ ] Contador de caracteres funciona
- [ ] Botão "Salvar" envia dados para API
- [ ] Mensagem de sucesso aparece
- [ ] Se clicar "Cancelar", formulário volta ao original
- [ ] Se a API falhar, mensagem de erro aparece
- [ ] Se corrigir a erro e tentar novamente, funciona

---

## Comando Rápido para Tudo

### Rodar testes e ver UI

```bash
cd frontend && npm install && npm run test:ui
```

### Rodar testes em modo watch (reinicia ao salvar)

```bash
cd frontend && npm test -- --watch
```

### Rodar testes com cobertura

```bash
cd frontend && npm run test:coverage
```

---

## O Que Significa "Dados Subindo"

Quando você vê este teste passar:

```javascript
expect(apiModule.default.put).toHaveBeenCalledWith(
  '/player/my-characters/1',
  {
    codename: 'Novo Nome',
    description: 'Nova descrição',
  }
)
```

Significa:
✅ O formulário **pega** os dados do usuário
✅ O formulário **formata** corretamente como JSON
✅ O formulário **envia** para a URL correta
✅ O formulário **inclui** todos os campos necessários

---

## Estrutura de Pastas

```
frontend/
├── src/
│   └── components/
│       └── player/
│           ├── PlayerCharacterEditor.jsx          ← Novo componente
│           ├── PlayerCharacterEditor.test.jsx     ← Testes (você está aqui!)
│           ├── PlayerCharacter.jsx                ← Exibição
│           └── PlayerCharacter.test.jsx           ← Testes de exibição
├── vitest.config.js                              ← Config de testes
└── package.json                                   ← Dependências

Na raiz do projeto:
├── TESTING.md                 ← Guia completo de testes
└── INTERFACE_TESTING.md       ← Guia de testes de interface (você leu!)
```

---

## Próximos Passos

1. **Agora:** Rodar `npm run test:ui` e ver os testes passando ✅

2. **Depois:** Integrar PlayerCharacterEditor em PlayerDashboard

3. **Então:** Testar fluxo completo (edit → save → sucesso)

4. **Finalmente:** Deploy para produção 🚀

---

## Dúvidas Frequentes

**P: Por que usar testes em vez de testar manualmente?**
R: Você faz uma vez e roda centenas de vezes. Economia de tempo + nenhum bug passa!

**P: Posso rodar testes enquanto desenvolvo?**
R: Sim! Use `npm test -- --watch` para reiniciar ao salvar arquivo.

**P: E se um teste falhar?**
R: Leia a mensagem de erro e veja qual expect falhou. A mensagem diz exatamente o que esperava vs. obt.

**P: Preciso alterar o backend para rodar testes?**
R: Não! Os testes usam mock da API (fingem que API existe).

---

## Links Rápidos

- 📖 [Guia Completo de Testes](TESTING.md)
- 📖 [Guia Detalhado de Interface](INTERFACE_TESTING.md)
- 🧪 [Arquivo de Testes](frontend/src/components/player/PlayerCharacterEditor.test.jsx)
- 🎨 [Componente de Edição](frontend/src/components/player/PlayerCharacterEditor.jsx)

---

**Agora é com você! Execute `npm run test:ui` e veja seus testes rodando verdes! ✨**

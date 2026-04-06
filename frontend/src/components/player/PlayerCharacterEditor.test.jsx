/**
 * Testes de Integração - PlayerCharacterEditor
 * Testa formulário, validação e envio de dados para a API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlayerCharacterEditor from '../components/player/PlayerCharacterEditor'
import * as apiModule from '../../services/api'

// Mock da API
vi.mock('../../services/api', () => ({
  default: {
    put: vi.fn(),
  },
}))

const mockCharacter = {
  id: 1,
  name: 'Aragorn',
  race: 'Humano',
  class: 'Guerreiro',
  level: 15,
  codename: 'O Montador',
  description: 'Um guerreiro nobre',
}

describe('PlayerCharacterEditor - Integração com API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderização e Layout', () => {
    it('deve renderizar o formulário com campos de edição', () => {
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      expect(screen.getByLabelText('Codinome')).toBeInTheDocument()
      expect(screen.getByLabelText('Descrição')).toBeInTheDocument()
    })

    it('deve exibir dados imutáveis do personagem', () => {
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      expect(screen.getByText('Aragorn')).toBeInTheDocument()
      expect(screen.getByText('Humano')).toBeInTheDocument()
      expect(screen.getByText('Guerreiro')).toBeInTheDocument()
      expect(screen.getByText('15')).toBeInTheDocument()
    })

    it('deve preencher campos com dados atuais', () => {
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      const codenameInput = screen.getByLabelText('Codinome')
      const descriptionInput = screen.getByLabelText('Descrição')
      
      expect(codenameInput.value).toBe('O Montador')
      expect(descriptionInput.value).toBe('Um guerreiro nobre')
    })

    it('deve exibir contador de caracteres', () => {
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      expect(screen.getByText('11/100')).toBeInTheDocument() // "O Montador" = 11 chars
      expect(screen.getByText('17/500')).toBeInTheDocument() // "Um guerreiro nobre" = 17 chars
    })

    it('deve renderizar botões de ação', () => {
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      expect(screen.getByRole('button', { name: 'Salvar Alterações' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    })
  })

  describe('Interação com Campos', () => {
    it('deve atualizar o valor do codinome ao digitar', async () => {
      const user = userEvent.setup()
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      const codenameInput = screen.getByLabelText('Codinome')
      await user.clear(codenameInput)
      await user.type(codenameInput, 'Novo Codinome')
      
      expect(codenameInput.value).toBe('Novo Codinome')
      expect(screen.getByText('14/100')).toBeInTheDocument()
    })

    it('deve atualizar o valor da descrição ao digitar', async () => {
      const user = userEvent.setup()
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      const descriptionInput = screen.getByLabelText('Descrição')
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Nova descrição')
      
      expect(descriptionInput.value).toBe('Nova descrição')
      expect(screen.getByText('14/500')).toBeInTheDocument()
    })

    it('deve respeitar limite de caracteres do codinome', async () => {
      const user = userEvent.setup()
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      const codenameInput = screen.getByLabelText('Codinome')
      await user.clear(codenameInput)
      
      // Tentar digitar 101 caracteres
      const longText = 'a'.repeat(101)
      await user.type(codenameInput, longText)
      
      // input maxLength deve limitar a 100
      expect(codenameInput.value).toHaveLength(100)
    })

    it('deve respeitar limite de caracteres da descrição', async () => {
      const user = userEvent.setup()
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      const descriptionInput = screen.getByLabelText('Descrição')
      await user.clear(descriptionInput)
      
      const longText = 'a'.repeat(501)
      await user.type(descriptionInput, longText)
      
      expect(descriptionInput.value).toHaveLength(500)
    })

    it('deve limpar formulário ao clicar em Cancelar', async () => {
      const user = userEvent.setup()
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      const codenameInput = screen.getByLabelText('Codinome')
      const descriptionInput = screen.getByLabelText('Descrição')
      
      await user.clear(codenameInput)
      await user.type(codenameInput, 'Novo Codinome')
      
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Nova descrição')
      
      const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
      await user.click(cancelButton)
      
      // Deve voltar aos valores originais
      expect(codenameInput.value).toBe('O Montador')
      expect(descriptionInput.value).toBe('Um guerreiro nobre')
    })
  })

  describe('Validação de Formulário', () => {
    it('deve validar codinome com mais de 100 caracteres', async () => {
      const user = userEvent.setup()
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      const codenameInput = screen.getByLabelText('Codinome')
      await user.clear(codenameInput)
      await user.type(codenameInput, 'a'.repeat(101))
      
      const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(
          screen.getByText('Codinome não pode ter mais de 100 caracteres')
        ).toBeInTheDocument()
      })
    })

    it('deve validar descrição com mais de 500 caracteres', async () => {
      const user = userEvent.setup()
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      const descriptionInput = screen.getByLabelText('Descrição')
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'a'.repeat(501))
      
      const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(
          screen.getByText('Descrição não pode ter mais de 500 caracteres')
        ).toBeInTheDocument()
      })
    })

    it('deve permitir envio com dados vazios (campos opcionais)', async () => {
      const user = userEvent.setup()
      
      // Mock da API para sucesso
      apiModule.default.put.mockResolvedValueOnce({
        data: { ...mockCharacter, codename: '', description: '' }
      })
      
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      const codenameInput = screen.getByLabelText('Codinome')
      const descriptionInput = screen.getByLabelText('Descrição')
      
      await user.clear(codenameInput)
      await user.clear(descriptionInput)
      
      const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(apiModule.default.put).toHaveBeenCalled()
      })
    })
  })

  describe('Envio de Dados para API', () => {
    it('deve chamar API com dados corretos ao submeter formulário', async () => {
      const user = userEvent.setup()
      
      apiModule.default.put.mockResolvedValueOnce({
        data: mockCharacter
      })
      
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      const codenameInput = screen.getByLabelText('Codinome')
      
      await user.clear(codenameInput)
      await user.type(codenameInput, 'Elessar')
      
      const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(apiModule.default.put).toHaveBeenCalledWith(
          '/my-characters/1',
          {
            codename: 'Elessar',
            description: 'Um guerreiro nobre',
          }
        )
      })
    })

    it('deve enviar null para campos vazios', async () => {
      const user = userEvent.setup()
      
      apiModule.default.put.mockResolvedValueOnce({
        data: mockCharacter
      })
      
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      const codenameInput = screen.getByLabelText('Codinome')
      
      await user.clear(codenameInput)
      
      const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(apiModule.default.put).toHaveBeenCalledWith(
          '/my-characters/1',
          {
            codename: null,
            description: 'Um guerreiro nobre',
          }
        )
      })
    })

    it('deve desabilitar botões durante o envio', async () => {
      const user = userEvent.setup()
      
      let resolveRequest
      apiModule.default.put.mockReturnValueOnce(
        new Promise(resolve => {
          resolveRequest = resolve
        })
      )
      
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
      await user.click(submitButton)
      
      expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
      
      resolveRequest({ data: mockCharacter })
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Salvar Alterações' })).not.toBeDisabled()
      })
    })

    it('deve mostrar mensagem de sucesso após atualização', async () => {
      const user = userEvent.setup()
      
      apiModule.default.put.mockResolvedValueOnce({
        data: mockCharacter
      })
      
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Personagem atualizado com sucesso!')).toBeInTheDocument()
      })
    })

    it('deve chamar callback onUpdate com dados atualizados', async () => {
      const user = userEvent.setup()
      const onUpdate = vi.fn()
      
      const updatedCharacter = { ...mockCharacter, codename: 'Novo Nome' }
      apiModule.default.put.mockResolvedValueOnce({
        data: updatedCharacter
      })
      
      render(
        <PlayerCharacterEditor character={mockCharacter} onUpdate={onUpdate} />
      )
      
      const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(updatedCharacter)
      })
    })
  })

  describe('Tratamento de Erros', () => {
    it('deve exibir erro da API ao falhar', async () => {
      const user = userEvent.setup()
      
      apiModule.default.put.mockRejectedValueOnce({
        response: {
          data: {
            detail: 'Você não tem permissão para editar este personagem'
          }
        }
      })
      
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      const codenameInput = screen.getByLabelText('Codinome')
      await user.clear(codenameInput)
      await user.type(codenameInput, 'Novo Nome')
      
      const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(
          screen.getByText('Você não tem permissão para editar este personagem')
        ).toBeInTheDocument()
      })
    })

    it('deve exibir erro genérico quando resposta não tem detail', async () => {
      const user = userEvent.setup()
      
      apiModule.default.put.mockRejectedValueOnce({
        response: {}
      })
      
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(
          screen.getByText('Erro ao atualizar personagem')
        ).toBeInTheDocument()
      })
    })

    it('deve permitir corrigir e reenviar após erro', async () => {
      const user = userEvent.setup()
      
      // Primeira chamada falha
      apiModule.default.put.mockRejectedValueOnce({
        response: {
          data: {
            detail: 'Erro na primeira tentativa'
          }
        }
      })
      
      // Segunda chamada sucede
      apiModule.default.put.mockResolvedValueOnce({
        data: mockCharacter
      })
      
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      const codenameInput = screen.getByLabelText('Codinome')
      await user.clear(codenameInput)
      await user.type(codenameInput, 'Nome Errado')
      
      let submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Erro na primeira tentativa')).toBeInTheDocument()
      })
      
      // Corrigir e reenviar
      await user.clear(codenameInput)
      await user.type(codenameInput, 'Nome Correto')
      
      submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Personagem atualizado com sucesso!')).toBeInTheDocument()
      })
    })
  })

  describe('Casos Extremos', () => {
    it('deve funcionar com codinome vazio', async () => {
      const user = userEvent.setup()
      
      apiModule.default.put.mockResolvedValueOnce({
        data: { ...mockCharacter, codename: '' }
      })
      
      const characterSemCodigo = { ...mockCharacter, codename: '' }
      render(<PlayerCharacterEditor character={characterSemCodigo} />)
      
      const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(apiModule.default.put).toHaveBeenCalled()
      })
    })

    it('deve funcionar com descrição vazia', async () => {
      const user = userEvent.setup()
      
      apiModule.default.put.mockResolvedValueOnce({
        data: { ...mockCharacter, description: '' }
      })
      
      const characterSemDesc = { ...mockCharacter, description: '' }
      render(<PlayerCharacterEditor character={characterSemDesc} />)
      
      const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(apiModule.default.put).toHaveBeenCalled()
      })
    })

    it('deve funcionar com caracteres especiais', async () => {
      const user = userEvent.setup()
      
      apiModule.default.put.mockResolvedValueOnce({
        data: mockCharacter
      })
      
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      const descriptionInput = screen.getByLabelText('Descrição')
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Descrição com émojis 🐉 e símbolos @#$%')
      
      const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(apiModule.default.put).toHaveBeenCalledWith(
          '/my-characters/1',
          expect.objectContaining({
            description: 'Descrição com émojis 🐉 e símbolos @#$%'
          })
        )
      })
    })

    it('deve funcionar com quebras de linha na descrição', async () => {
      const user = userEvent.setup()
      
      apiModule.default.put.mockResolvedValueOnce({
        data: mockCharacter
      })
      
      render(<PlayerCharacterEditor character={mockCharacter} />)
      
      const descriptionInput = screen.getByLabelText('Descrição')
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Linha 1{Enter}Linha 2{Enter}Linha 3')
      
      const submitButton = screen.getByRole('button', { name: 'Salvar Alterações' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(apiModule.default.put).toHaveBeenCalled()
      })
    })
  })
})

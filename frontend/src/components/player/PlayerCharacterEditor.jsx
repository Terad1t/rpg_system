import { useState } from 'react'
import { Card, Button, Input } from '../common'
import api from '../../services/api'

export default function PlayerCharacterEditor({ character, onUpdate }) {
  const [formData, setFormData] = useState({
    codename: character.codename || '',
    description: character.description || '',
  })
  
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const validateForm = () => {
    const newErrors = {}
    
    if (formData.codename.length > 100) {
      newErrors.codename = 'Codinome não pode ter mais de 100 caracteres'
    }
    
    if (formData.description.length > 500) {
      newErrors.description = 'Descrição não pode ter mais de 500 caracteres'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpar erro ao digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setSuccessMessage('')
    
    try {
      const response = await api.put(
        `/my-characters/${character.id}`,
        {
          codename: formData.codename || null,
          description: formData.description || null,
        }
      )
      
      setSuccessMessage('Personagem atualizado com sucesso!')
      
      if (onUpdate) {
        onUpdate(response.data)
      }
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Erro ao atualizar personagem'
      setErrors({ submit: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Editar Personagem">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Exibir dados imutáveis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-dark-border">
          <div>
            <label className="text-secondary text-sm">Nome (imutável)</label>
            <p className="text-lg font-bold text-orange-500">{character.name}</p>
          </div>
          <div>
            <label className="text-secondary text-sm">Raça (imutável)</label>
            <p className="text-lg font-bold text-orange-500">{character.race}</p>
          </div>
          <div>
            <label className="text-secondary text-sm">Classe (imutável)</label>
            <p className="text-lg font-bold text-orange-500">{character.class}</p>
          </div>
          <div>
            <label className="text-secondary text-sm">Nível (imutável)</label>
            <p className="text-lg font-bold text-orange-500">{character.level}</p>
          </div>
        </div>

        {/* Campos editáveis */}
        <div>
          <label htmlFor="codename" className="block text-secondary text-sm mb-2">
            Codinome
          </label>
          <Input
            id="codename"
            name="codename"
            type="text"
            placeholder="Digite um codinome para seu personagem"
            value={formData.codename}
            onChange={handleChange}
            maxLength={100}
            disabled={loading}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-red-500">
              {errors.codename}
            </span>
            <span className="text-xs text-secondary">
              {formData.codename.length}/100
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-secondary text-sm mb-2">
            Descrição
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="Descreva seu personagem, sua história, etc..."
            value={formData.description}
            onChange={handleChange}
            maxLength={500}
            disabled={loading}
            rows={6}
            className="w-full px-3 py-2 bg-dark-secondary border border-dark-border rounded-lg text-white placeholder-dark-secondary focus:outline-none focus:border-orange-500 transition-colors resize-none"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-red-500">
              {errors.description}
            </span>
            <span className="text-xs text-secondary">
              {formData.description.length}/500
            </span>
          </div>
        </div>

        {/* Mensagens */}
        {successMessage && (
          <div className="p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-sm">
            {successMessage}
          </div>
        )}

        {errors.submit && (
          <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
            {errors.submit}
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3 pt-4 border-t border-dark-border">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFormData({
                codename: character.codename || '',
                description: character.description || '',
              })
              setErrors({})
              setSuccessMessage('')
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}

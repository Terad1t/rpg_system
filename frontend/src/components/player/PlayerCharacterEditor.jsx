import { useState } from 'react'
import { Card, Button, Input } from '../common'
import api, { assetUrl, errorMessage } from '../../services/api'

export const CODENAME_MAX = 50
export const DESCRIPTION_MAX = 2000
const PORTRAIT_MAX = 2000
const ACCEPTED_IMAGES = 'image/png,image/jpeg,image/webp'

export default function PlayerCharacterEditor({ character, onUpdate }) {
  const raceName = typeof character.race === 'string' ? character.race : character.race?.name

  const [formData, setFormData] = useState({
    codename: character.codename || '',
    description: character.description || '',
    portrait: character.portrait || '',
  })
  
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [uploadingPortrait, setUploadingPortrait] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    
    if (formData.codename.length > CODENAME_MAX) {
      newErrors.codename = `Codinome não pode ter mais de ${CODENAME_MAX} caracteres`
    }

    if (formData.description.length > DESCRIPTION_MAX) {
      newErrors.description = `Descrição não pode ter mais de ${DESCRIPTION_MAX} caracteres`
    }

    const portrait = formData.portrait.trim()
    if (portrait.length > PORTRAIT_MAX) {
      newErrors.portrait = `URL da imagem não pode ter mais de ${PORTRAIT_MAX} caracteres`
    } else if (portrait && !/^(https?:\/\/|\/static\/)/.test(portrait)) {
      newErrors.portrait = 'Use um link http(s) ou envie um arquivo'
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
        `/api/my-characters/${character.id}`,
        {
          codename: formData.codename || null,
          description: formData.description || null,
          portrait: formData.portrait.trim() || null,
        }
      )
      
      setSuccessMessage('Personagem atualizado com sucesso!')
      
      if (onUpdate) {
        onUpdate(response.data)
      }
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      setErrors({ submit: errorMessage(error, 'Erro ao atualizar personagem') })
    } finally {
      setLoading(false)
    }
  }

  const handlePortraitUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPortrait(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const response = await api.post(`/api/my-characters/${character.id}/portrait`, form)
      const uploadedPortrait = response?.data?.portrait || ''
      setFormData((prev) => ({ ...prev, portrait: uploadedPortrait }))
      onUpdate?.({ ...character, portrait: uploadedPortrait })
      setSuccessMessage('Portrait enviado com sucesso!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      setErrors((prev) => ({ ...prev, submit: errorMessage(error, 'Erro ao enviar a imagem') }))
    } finally {
      setUploadingPortrait(false)
    }
  }

  return (
    <Card title="Editar Personagem" className="border border-white/10 bg-[#08111f]/90">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Exibir dados imutáveis */}
        <div className="grid grid-cols-1 gap-4 border-b border-white/10 pb-4 md:grid-cols-2">
          <div>
            <label className="text-xs uppercase tracking-[0.35em] text-slate-400">Nome (imutável)</label>
            <p className="text-lg font-bold text-white">{character.name}</p>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.35em] text-slate-400">Raça (imutável)</label>
            <p className="text-lg font-bold text-cyan-200">{raceName || 'Raça indefinida'}</p>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.35em] text-slate-400">Classe (imutável)</label>
            <p className="text-lg font-bold text-orange-200">{character.class}</p>
          </div>
        </div>

        <div>
          <label htmlFor="portrait" className="block text-xs uppercase tracking-[0.35em] text-slate-400 mb-2">
            Portrait / Foto
          </label>
          <Input
            id="portrait"
            name="portrait"
            type="text"
            placeholder="URL da foto do personagem"
            value={formData.portrait}
            onChange={handleChange}
            maxLength={PORTRAIT_MAX}
            disabled={loading}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-red-500">
              {errors.portrait}
            </span>
            <span className="text-xs text-secondary">
              {formData.portrait.length}/{PORTRAIT_MAX}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.25em] text-slate-300 hover:border-cyan-400/50 hover:text-white">
              <input
                type="file"
                accept={ACCEPTED_IMAGES}
                onChange={handlePortraitUpload}
                disabled={loading || uploadingPortrait}
                className="hidden"
              />
              {uploadingPortrait ? 'Enviando...' : 'Enviar imagem (PNG, JPG, WebP)'}
            </label>
            {formData.portrait && (
              <a href={assetUrl(formData.portrait)} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-200 underline">
                Ver imagem
              </a>
            )}
          </div>
        </div>

        {/* Campos editáveis */}
        <div>
          <label htmlFor="codename" className="block text-xs uppercase tracking-[0.35em] text-slate-400 mb-2">
            Codinome
          </label>
          <Input
            id="codename"
            name="codename"
            type="text"
            placeholder="Digite um codinome para seu personagem"
            value={formData.codename}
            onChange={handleChange}
            maxLength={CODENAME_MAX}
            disabled={loading}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-red-500">
              {errors.codename}
            </span>
            <span className="text-xs text-secondary">
              {formData.codename.length}/{CODENAME_MAX}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-xs uppercase tracking-[0.35em] text-slate-400 mb-2">
            Descrição
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="Descreva seu personagem, sua história, etc..."
            value={formData.description}
            onChange={handleChange}
            maxLength={DESCRIPTION_MAX}
            disabled={loading}
            rows={6}
            className="w-full resize-none rounded-lg border border-white/10 bg-[#0c1528] px-3 py-2 text-white placeholder-slate-500 transition-colors focus:border-cyan-400 focus:outline-none"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-red-500">
              {errors.description}
            </span>
            <span className="text-xs text-secondary">
              {formData.description.length}/{DESCRIPTION_MAX}
            </span>
          </div>
        </div>

        {/* Mensagens */}
        {successMessage && (
          <div className="rounded-lg border border-green-500/40 bg-green-500/20 p-3 text-sm text-green-300">
            {successMessage}
          </div>
        )}

        {errors.submit && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/20 p-3 text-sm text-red-300">
            {errors.submit}
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3 border-t border-white/10 pt-4">
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
                portrait: character.portrait || '',
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

import { useEffect, useMemo, useState } from 'react'
import CrudManager from '../components/master/CrudManager'
import { Button, Card } from '../components/common'
import api, { errorMessage } from '../services/api'

const TYPE_OPTIONS = [
  { value: 'class', label: 'Classe' },
  { value: 'race', label: 'Raça' },
  { value: 'item', label: 'Item' },
]
const TYPE_LABELS = Object.fromEntries(TYPE_OPTIONS.map((option) => [option.value, option.label]))

const toOptions = (list) => list.map((entry) => ({ value: String(entry.id), label: entry.name }))
const toId = (value) => (value === '' || value === null || value === undefined ? null : Number(value))

function toPayload(form) {
  // Só o vínculo correspondente ao tipo é enviado; os outros vão nulos.
  return {
    name: form.name.trim(),
    tipo: form.tipo,
    custo_vigor: Number(form.custo_vigor) || 0,
    custo_vida: Number(form.custo_vida) || 0,
    dano_base: Number(form.dano_base) || 0,
    efeitos_atributos: form.efeitos_atributos || null,
    raca_id: form.tipo === 'race' ? toId(form.raca_id) : null,
    classe_id: form.tipo === 'class' ? toId(form.classe_id) : null,
    item_id: form.tipo === 'item' ? toId(form.item_id) : null,
  }
}

function toForm(skill) {
  return {
    ...skill,
    raca_id: skill.raca_id ? String(skill.raca_id) : '',
    classe_id: skill.classe_id ? String(skill.classe_id) : '',
    item_id: skill.item_id ? String(skill.item_id) : '',
    efeitos_atributos: skill.efeitos_atributos || '',
  }
}

function AssignSkill({ skills }) {
  const [characters, setCharacters] = useState([])
  const [characterId, setCharacterId] = useState('')
  const [skillId, setSkillId] = useState('')
  const [message, setMessage] = useState(null)

  useEffect(() => {
    api
      .get('/api/master/characters/')
      .then((response) => setCharacters(response.data || []))
      .catch((err) => setMessage({ type: 'error', text: errorMessage(err) }))
  }, [])

  const assign = async () => {
    try {
      await api.post(`/api/characters/${characterId}/habilidades/`, { habilidade_id: Number(skillId) })
      setMessage({ type: 'success', text: 'Habilidade atribuída.' })
    } catch (err) {
      setMessage({
        type: 'error',
        text: errorMessage(err, 'Não foi possível atribuir (a raça, classe ou item do personagem não combina com a habilidade).'),
      })
    }
  }

  const selectClass = 'w-full rounded-lg border border-white/10 bg-[#0c1528] px-3 py-2 text-white'

  return (
    <Card title="Atribuir habilidade a um personagem" className="border border-white/10 bg-[#08111f]/90">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <select aria-label="Personagem" className={selectClass} value={characterId} onChange={(e) => setCharacterId(e.target.value)}>
          <option value="">Personagem...</option>
          {characters.map((character) => (
            <option key={character.id} value={character.id}>
              {character.codename || character.name} ({character.race?.name || '?'} • {character.class || '?'})
            </option>
          ))}
        </select>
        <select aria-label="Habilidade" className={selectClass} value={skillId} onChange={(e) => setSkillId(e.target.value)}>
          <option value="">Habilidade...</option>
          {skills.map((skill) => (
            <option key={skill.value} value={skill.value}>
              {skill.label}
            </option>
          ))}
        </select>
        <Button onClick={assign} disabled={!characterId || !skillId}>
          Atribuir
        </Button>
      </div>
      {message && (
        <p role={message.type === 'error' ? 'alert' : 'status'} className={`mt-3 text-sm ${message.type === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
          {message.text}
        </p>
      )}
    </Card>
  )
}

export default function SkillManager() {
  const [catalog, setCatalog] = useState({ racas: [], classes: [], items: [], skills: [] })

  useEffect(() => {
    Promise.all([api.get('/api/racas/'), api.get('/api/classes/'), api.get('/api/items/'), api.get('/api/habilidades/')])
      .then(([racas, classes, items, skills]) =>
        setCatalog({ racas: racas.data, classes: classes.data, items: items.data, skills: skills.data }),
      )
      .catch(() => {})
  }, [])

  const fields = useMemo(
    () => [
      { name: 'name', label: 'Nome', required: true, maxLength: 100 },
      { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: TYPE_OPTIONS, default: 'class' },
      { name: 'classe_id', label: 'Classe (se tipo = Classe)', type: 'select', options: toOptions(catalog.classes) },
      { name: 'raca_id', label: 'Raça (se tipo = Raça)', type: 'select', options: toOptions(catalog.racas) },
      { name: 'item_id', label: 'Item (se tipo = Item)', type: 'select', options: toOptions(catalog.items) },
      { name: 'dano_base', label: 'Dano base', type: 'number', min: 0, default: 0 },
      { name: 'custo_vigor', label: 'Custo de vigor', type: 'number', min: 0, default: 0 },
      { name: 'custo_vida', label: 'Custo de vida', type: 'number', min: 0, default: 0 },
      { name: 'efeitos_atributos', label: 'Efeitos / descrição', type: 'textarea' },
    ],
    [catalog.classes, catalog.racas, catalog.items],
  )

  const nameOf = (list, id) => list.find((entry) => entry.id === id)?.name

  return (
    <div className="space-y-6">
      <CrudManager
        title="Habilidades"
        singular="Habilidade"
        endpoint="/api/habilidades/"
        fields={fields}
        toPayload={toPayload}
        toForm={toForm}
        renderItem={(skill) => (
          <div>
            <p className="font-semibold text-white">
              {skill.name}
              <span className="ml-2 text-xs uppercase tracking-[0.25em] text-orange-200">
                {TYPE_LABELS[skill.tipo] || skill.tipo}:{' '}
                {nameOf(catalog.classes, skill.classe_id) || nameOf(catalog.racas, skill.raca_id) || nameOf(catalog.items, skill.item_id) || '—'}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Dano {skill.dano_base ?? 0} • Vigor -{skill.custo_vigor ?? 0} • Vida -{skill.custo_vida ?? 0}
            </p>
          </div>
        )}
      />
      <AssignSkill skills={toOptions(catalog.skills)} />
    </div>
  )
}

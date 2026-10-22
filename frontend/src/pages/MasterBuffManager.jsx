import CrudManager from '../components/master/CrudManager'

const FIELDS = [
  { name: 'name', label: 'Nome', required: true, maxLength: 100 },
  {
    name: 'kind',
    label: 'Tipo',
    type: 'select',
    required: true,
    default: 'buff',
    options: [
      { value: 'buff', label: 'Buff' },
      { value: 'debuff', label: 'Debuff' },
    ],
  },
  { name: 'description', label: 'Descrição', type: 'textarea' },
  {
    name: 'duration_default_seconds',
    label: 'Duração padrão (segundos)',
    type: 'number',
    min: 0,
    hint: 'Em branco = dura até o mestre remover.',
  },
  { name: 'stackable', label: 'Acumula (pode ser aplicado mais de uma vez)', type: 'checkbox' },
]

const toPayload = (form) => ({
  name: form.name.trim(),
  kind: form.kind,
  description: form.description || null,
  duration_default_seconds: form.duration_default_seconds === '' ? null : Number(form.duration_default_seconds),
  stackable: Boolean(form.stackable),
})

const toForm = (buff) => ({
  name: buff.name,
  kind: buff.kind,
  description: buff.description || '',
  duration_default_seconds: buff.duration_default_seconds ?? '',
  stackable: Boolean(buff.stackable),
})

export default function MasterBuffManager() {
  return (
    <CrudManager
      title="Buffs e debuffs"
      singular="Efeito"
      endpoint="/api/master/buffs/"
      fields={FIELDS}
      toPayload={toPayload}
      toForm={toForm}
      renderItem={(buff) => (
        <div>
          <p className="font-semibold text-white">
            {buff.name}
            <span className={`ml-2 text-xs uppercase tracking-[0.25em] ${buff.kind === 'buff' ? 'text-cyan-200' : 'text-orange-200'}`}>
              {buff.kind}
            </span>
          </p>
          {buff.description && <p className="mt-1 text-sm text-slate-300">{buff.description}</p>}
          <p className="mt-1 text-xs text-slate-500">
            {buff.duration_default_seconds ? `${buff.duration_default_seconds}s` : 'sem duração'}
            {buff.stackable && ' • acumula'}
          </p>
        </div>
      )}
    />
  )
}

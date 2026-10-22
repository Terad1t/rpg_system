import CrudManager from '../components/master/CrudManager'

const FIELDS = [
  { name: 'name', label: 'Nome', required: true, maxLength: 100 },
  { name: 'subclass', label: 'Subclasse', placeholder: 'Ex.: Eden, Nede' },
  { name: 'description', label: 'Descrição', type: 'textarea' },
]

const toPayload = (form) => ({
  name: form.name.trim(),
  subclass: form.subclass || null,
  description: form.description || null,
})

export default function ClassManager() {
  return (
    <CrudManager
      title="Classes"
      singular="Classe"
      endpoint="/api/classes/"
      fields={FIELDS}
      toPayload={toPayload}
      toForm={(classe) => ({ name: classe.name, subclass: classe.subclass || '', description: classe.description || '' })}
      renderItem={(classe) => (
        <div>
          <p className="font-semibold text-white">
            {classe.name}
            {classe.subclass && <span className="ml-2 text-xs uppercase tracking-[0.25em] text-cyan-200">{classe.subclass}</span>}
          </p>
          {classe.description && <p className="mt-1 text-sm text-slate-300">{classe.description}</p>}
        </div>
      )}
    />
  )
}

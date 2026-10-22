import CrudManager from '../components/master/CrudManager'
import { assetUrl } from '../services/api'

const FIELDS = [
  { name: 'name', label: 'Nome', required: true, maxLength: 100 },
  { name: 'description', label: 'Descrição', type: 'textarea' },
  { name: 'image', label: 'Imagem (URL)', placeholder: 'https://...' },
]

const toPayload = (form) => ({
  name: form.name.trim(),
  description: form.description || null,
  image: form.image || null,
})

export default function RaceManager() {
  return (
    <CrudManager
      title="Raças"
      singular="Raça"
      endpoint="/api/racas/"
      fields={FIELDS}
      toPayload={toPayload}
      toForm={(race) => ({ name: race.name, description: race.description || '', image: race.image || '' })}
      renderItem={(race) => (
        <div className="flex gap-3">
          {race.image && <img src={assetUrl(race.image)} alt="" className="h-12 w-12 rounded object-cover" />}
          <div>
            <p className="font-semibold text-white">{race.name}</p>
            {race.description && <p className="mt-1 text-sm text-slate-300">{race.description}</p>}
          </div>
        </div>
      )}
    />
  )
}

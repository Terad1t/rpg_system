import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import api, { errorMessage } from '../../services/api'
import { Button, Card } from '../common'

const inputClass =
  'w-full rounded-lg border border-white/10 bg-[#0c1528] px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none'

function emptyFormFor(fields) {
  return Object.fromEntries(fields.map((field) => [field.name, field.type === 'checkbox' ? Boolean(field.default) : (field.default ?? '')]))
}

function Field({ field, value, onChange, mode }) {
  const id = useId()
  const required = field.required && !(mode === 'edit' && field.optionalOnEdit)
  const common = { id, name: field.name, required, disabled: field.disabled, 'aria-describedby': field.hint ? `${id}-hint` : undefined }

  let control
  if (field.type === 'textarea') {
    control = <textarea {...common} rows={field.rows || 3} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} maxLength={field.maxLength} />
  } else if (field.type === 'select') {
    control = (
      <select {...common} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">{field.placeholder || 'Selecione...'}</option>
        {(field.options || []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  } else if (field.type === 'checkbox') {
    return (
      <label htmlFor={id} className="flex items-center gap-2 text-sm text-slate-300">
        <input {...common} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        {field.label}
      </label>
    )
  } else {
    control = (
      <input
        {...common}
        type={field.type || 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={mode === 'edit' && field.optionalOnEdit ? 'Deixe em branco para manter' : field.placeholder}
        className={inputClass}
        min={field.min}
        max={field.max}
        minLength={field.minLength}
        maxLength={field.maxLength}
        pattern={field.pattern}
        inputMode={field.inputMode}
        autoComplete={field.autoComplete || 'off'}
      />
    )
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs uppercase tracking-[0.3em] text-slate-400">
        {field.label}
        {required && <span className="text-orange-300"> *</span>}
      </label>
      {control}
      {field.hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
          {field.hint}
        </p>
      )}
    </div>
  )
}

/**
 * Tela de cadastro genérica: lista + formulário de criar/editar + remover.
 *
 * - `endpoint`: coleção (GET lista, POST cria); `itemEndpoint(id)`: PUT/DELETE de um item.
 * - `fields`: definição dos campos do formulário.
 * - `toPayload(form, mode)`: converte o formulário no corpo enviado à API.
 * - `toForm(item)`: converte um item da API em valores do formulário.
 * - `renderItem(item)`: conteúdo de cada linha da lista.
 * - `itemActions(item, reload, notify)`: botões extras por item.
 */
export default function CrudManager({
  title,
  singular,
  endpoint,
  itemEndpoint = (id) => `${endpoint}${id}`,
  fields,
  toPayload = (form) => form,
  toForm,
  renderItem,
  itemActions,
  canEdit = () => true,
  canDelete = () => true,
  deleteLabel = 'Remover',
}) {
  const emptyForm = useMemo(() => emptyFormFor(fields), [fields])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState(null)
  const mode = editingId ? 'edit' : 'create'

  const notify = useCallback((type, text) => setMessage({ type, text }), [])

  const reload = useCallback(async () => {
    try {
      const response = await api.get(endpoint)
      setItems(response.data || [])
    } catch (err) {
      notify('error', errorMessage(err, `Não foi possível carregar ${title.toLowerCase()}.`))
    } finally {
      setLoading(false)
    }
  }, [endpoint, notify, title])

  useEffect(() => {
    reload()
  }, [reload])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = toPayload(form, mode)
      if (editingId) await api.put(itemEndpoint(editingId), payload)
      else await api.post(endpoint, payload)
      notify('success', editingId ? `${singular} atualizado(a).` : `${singular} criado(a).`)
      resetForm()
      await reload()
    } catch (err) {
      notify('error', errorMessage(err, `Não foi possível salvar ${singular.toLowerCase()}.`))
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setForm({ ...emptyForm, ...(toForm ? toForm(item) : item) })
    setMessage(null)
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Remover ${singular.toLowerCase()} "${item.name || item.login || item.id}"?`)) return
    try {
      await api.delete(itemEndpoint(item.id))
      notify('success', `${singular} removido(a).`)
      if (editingId === item.id) resetForm()
      await reload()
    } catch (err) {
      notify('error', errorMessage(err, `Não foi possível remover ${singular.toLowerCase()}.`))
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Card title={editingId ? `Editar ${singular.toLowerCase()}` : `Novo(a) ${singular.toLowerCase()}`} className="border border-white/10 bg-[#08111f]/90">
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields
            .filter((field) => !(mode === 'edit' && field.createOnly))
            .map((field) => (
              <Field
                key={field.name}
                field={field}
                mode={mode}
                value={form[field.name]}
                onChange={(value) => setForm((prev) => ({ ...prev, [field.name]: value }))}
              />
            ))}

          {message && (
            <p
              role={message.type === 'error' ? 'alert' : 'status'}
              className={`rounded-lg border px-3 py-2 text-sm ${message.type === 'error' ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'}`}
            >
              {message.text}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar'}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card title={`${title} (${items.length})`} className="border border-white/10 bg-[#08111f]/90">
        {loading ? (
          <p className="text-sm text-slate-400">Carregando...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum registro ainda.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className={`border p-4 ${editingId === item.id ? 'border-cyan-400/50 bg-cyan-400/5' : 'border-white/10 bg-white/5'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">{renderItem ? renderItem(item) : <p className="font-semibold text-white">{item.name}</p>}</div>
                  <div className="flex flex-wrap gap-2">
                    {itemActions?.(item, reload, notify)}
                    {canEdit(item) && (
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(item)}>
                        Editar
                      </Button>
                    )}
                    {canDelete(item) && (
                      <Button size="sm" variant="danger" onClick={() => handleDelete(item)}>
                        {deleteLabel}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

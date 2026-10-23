import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useQueryClient, type QueryKey, type UseQueryResult } from '@tanstack/react-query'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { del, errorMessage, post, put } from '@/api/client'
import { Button } from '@/ui/Button'
import { CheckboxField, SelectField, TextArea, TextField, type Option } from '@/ui/Field'
import { EmptyState, QueryBoundary } from '@/ui/feedback'
import { Panel } from '@/ui/Panel'
import { useConfirm } from '@/ui/confirm'
import { useToast } from '@/ui/toast'
import { cn } from '@/ui/cn'

import type { FieldValue } from '@/lib/forms'

export type { FieldValue }
export type FormValues = Record<string, FieldValue>

export interface FieldDef {
  name: string
  label: string
  type?: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'password' | 'url'
  required?: boolean
  /** Obrigatório só ao criar (ex.: senha). */
  requiredOnCreate?: boolean
  createOnly?: boolean
  options?: Option[]
  hint?: string
  placeholder?: string | null
  min?: number
  max?: number
  maxLength?: number
  pattern?: string
  inputMode?: 'numeric' | 'text'
  default?: FieldValue
  /** Esconde o campo conforme os valores atuais do formulário. */
  visible?: (values: FormValues) => boolean
}

interface CrudPageProps<T extends { id: number }> {
  title: string
  singular: string
  /** Gênero gramatical de `singular` ("nova raça" x "novo item"). */
  feminine?: boolean
  query: UseQueryResult<T[]>
  queryKey: QueryKey
  extraInvalidate?: QueryKey[]
  endpoint: string
  itemEndpoint?: (id: number) => string
  fields: FieldDef[]
  toPayload: (values: FormValues, mode: 'create' | 'edit') => unknown
  toForm: (item: T) => FormValues
  renderItem: (item: T) => ReactNode
  searchText?: (item: T) => string
  itemActions?: (item: T) => ReactNode
  canEdit?: (item: T) => boolean
  canDelete?: (item: T) => boolean
  description?: string
  emptyHint?: string
}

const defaults = (fields: FieldDef[]): FormValues =>
  Object.fromEntries(fields.map((field) => [field.name, field.default ?? (field.type === 'checkbox' ? false : '')]))

/** Lista + formulário de criar/editar + excluir, reaproveitado pelas telas de cadastro. */
export function CrudPage<T extends { id: number }>({
  title,
  singular,
  feminine = false,
  query,
  queryKey,
  extraInvalidate = [],
  endpoint,
  itemEndpoint = (id) => `${endpoint}${id}`,
  fields,
  toPayload,
  toForm,
  renderItem,
  searchText,
  itemActions,
  canEdit = () => true,
  canDelete = () => true,
  description,
  emptyHint,
}: CrudPageProps<T>) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const empty = useMemo(() => defaults(fields), [fields])
  const [values, setValues] = useState<FormValues>(empty)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const mode = editingId ? 'edit' : 'create'
  const o = feminine ? 'a' : 'o'
  const lower = singular.toLowerCase()

  const refresh = () => {
    for (const key of [queryKey, ...extraInvalidate]) queryClient.invalidateQueries({ queryKey: key })
  }

  const reset = () => {
    setValues(empty)
    setEditingId(null)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = toPayload(values, mode)
      if (editingId) await put(itemEndpoint(editingId), payload)
      else await post(endpoint, payload)
      toast.success(`${singular} ${editingId ? 'atualizad' : 'criad'}${o}.`)
      reset()
      refresh()
    } catch (error) {
      toast.error(errorMessage(error, `Não foi possível salvar ${feminine ? 'a' : 'o'} ${lower}.`))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item: T, label: string) => {
    const ok = await confirm({ title: `Excluir ${lower}?`, message: `"${label}" será removid${o} definitivamente.`, confirmLabel: 'Excluir', danger: true })
    if (!ok) return
    try {
      await del(itemEndpoint(item.id))
      toast.success(`${singular} excluíd${o}.`)
      if (editingId === item.id) reset()
      refresh()
    } catch (error) {
      toast.error(errorMessage(error, `Não foi possível excluir ${feminine ? 'a' : 'o'} ${lower}.`))
    }
  }

  const visibleFields = fields.filter((field) => !(mode === 'edit' && field.createOnly) && (field.visible?.(values) ?? true))

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <Panel
        title={editingId ? `Editar ${lower}` : `Nov${o} ${lower}`}
        eyebrow={title}
        className="h-fit lg:sticky lg:top-20"
      >
        {description && <p className="mb-4 text-sm text-parchment-muted">{description}</p>}
        <form onSubmit={submit} className="space-y-4">
          {visibleFields.map((field) => (
            <FieldInput
              key={field.name}
              field={field}
              mode={mode}
              value={values[field.name]}
              onChange={(value) => setValues((prev) => ({ ...prev, [field.name]: value }))}
            />
          ))}
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving} icon={editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />} className="flex-1">
              {editingId ? 'Salvar' : 'Criar'}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={reset}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Panel>

      <Panel
        title={`${title}${query.data ? ` (${query.data.length})` : ''}`}
        actions={
          searchText && (
            <label className="relative">
              <span className="sr-only">Buscar</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-parchment-faint" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="field-control h-8 w-48 pl-8" />
            </label>
          )
        }
      >
        <QueryBoundary query={query}>
          {(items) => {
            const term = search.trim().toLowerCase()
            const filtered = term && searchText ? items.filter((item) => searchText(item).toLowerCase().includes(term)) : items
            if (items.length === 0) return <EmptyState title="Nada cadastrado ainda">{emptyHint}</EmptyState>
            if (filtered.length === 0) return <EmptyState title="Nenhum resultado para a busca" />
            return (
              <ul className="divide-y divide-line">
                {filtered.map((item) => (
                  <li key={item.id} className={cn('flex flex-wrap items-start gap-3 py-3 first:pt-0 last:pb-0', editingId === item.id && 'rounded-md bg-gold/5')}>
                    <div className="min-w-0 flex-1">{renderItem(item)}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {itemActions?.(item)}
                      {canEdit(item) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Pencil className="h-3.5 w-3.5" />}
                          onClick={() => {
                            setEditingId(item.id)
                            setValues({ ...empty, ...toForm(item) })
                          }}
                        >
                          Editar
                        </Button>
                      )}
                      {canDelete(item) && (
                        <Button
                          size="sm"
                          variant="danger"
                          aria-label="Excluir"
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                          onClick={() => remove(item, String((item as { name?: string; login?: string }).name ?? (item as { login?: string }).login ?? item.id))}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )
          }}
        </QueryBoundary>
      </Panel>
    </div>
  )
}

function FieldInput({ field, mode, value, onChange }: { field: FieldDef; mode: 'create' | 'edit'; value: FieldValue; onChange: (v: FieldValue) => void }) {
  const required = field.required || (field.requiredOnCreate && mode === 'create')
  const common = { label: field.label, hint: field.hint, required }
  if (field.type === 'checkbox') return <CheckboxField label={field.label} checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
  if (field.type === 'textarea') return <TextArea {...common} maxLength={field.maxLength} value={String(value)} onChange={(e) => onChange(e.target.value)} />
  if (field.type === 'select')
    return <SelectField {...common} options={field.options ?? []} placeholder={field.placeholder} value={String(value)} onChange={(e) => onChange(e.target.value)} />
  return (
    <TextField
      {...common}
      type={field.type ?? 'text'}
      value={String(value)}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.requiredOnCreate && mode === 'edit' ? 'Deixe em branco para manter' : (field.placeholder ?? undefined)}
      min={field.min}
      max={field.max}
      maxLength={field.maxLength}
      pattern={field.pattern}
      inputMode={field.inputMode}
      autoComplete={field.type === 'password' ? 'new-password' : 'off'}
    />
  )
}

export { asString, int, options, text } from '@/lib/forms'

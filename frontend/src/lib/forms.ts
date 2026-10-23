// Conversões entre valores de formulário (texto) e o que a API espera.

export type FieldValue = string | boolean

/** Texto aparado, ou null se vazio. */
export const text = (value: FieldValue) => (typeof value === 'string' && value.trim() ? value.trim() : null)

/** Número, ou null se vazio. */
export const int = (value: FieldValue) => (value === '' || value === false ? null : Number(value))

export const asString = (value: number | string | null | undefined) => (value === null || value === undefined ? '' : String(value))

export const options = <T extends { id: number; name: string }>(list: T[] | undefined) =>
  (list ?? []).map((entry) => ({ value: entry.id, label: entry.name }))

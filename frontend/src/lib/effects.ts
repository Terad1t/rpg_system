export interface ActiveEffect {
  name: string
  expiresAt: Date | null
}

/**
 * Buffs/debuffs chegam como texto JSON (lista de `{name, expires_at?}`), lista
 * já decodificada ou texto livre antigo. Normaliza tudo.
 */
export function parseEffects(raw: unknown): ActiveEffect[] {
  if (!raw) return []
  let value: unknown = raw
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw)
    } catch {
      return raw
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ({ name, expiresAt: null }))
    }
  }
  if (!Array.isArray(value)) return []
  return value
    .map((effect): ActiveEffect => {
      if (typeof effect === 'string') return { name: effect, expiresAt: null }
      const item = effect as { name?: string; expires_at?: string }
      // O backend grava `expires_at` em UTC sem indicar o fuso.
      return { name: item?.name ?? '', expiresAt: item?.expires_at ? new Date(`${item.expires_at}Z`) : null }
    })
    .filter((effect) => effect.name)
}

export function remainingLabel(expiresAt: Date | null, now = Date.now()): string | null {
  if (!expiresAt || Number.isNaN(expiresAt.getTime())) return null
  const seconds = Math.max(0, Math.round((expiresAt.getTime() - now) / 1000))
  if (seconds >= 3600) return `${Math.round(seconds / 3600)} h`
  if (seconds >= 60) return `${Math.round(seconds / 60)} min`
  return `${seconds} s`
}

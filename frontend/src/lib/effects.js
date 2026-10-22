/**
 * Buffs/debuffs chegam do backend como texto JSON (lista de `{name, expires_at?}`),
 * lista já decodificada, ou texto livre antigo. Normaliza tudo para `[{ name, expiresAt }]`.
 */
export function parseEffects(raw) {
  if (!raw) return []
  let value = raw
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
    .map((effect) =>
      typeof effect === 'string'
        ? { name: effect, expiresAt: null }
        : { name: effect?.name ?? '', expiresAt: effect?.expires_at ? new Date(`${effect.expires_at}Z`) : null },
    )
    .filter((effect) => effect.name)
}

/** "2 min", "45 s" ou null se não expira. O backend grava `expires_at` em UTC sem fuso. */
export function remainingLabel(expiresAt, now = Date.now()) {
  if (!expiresAt || Number.isNaN(expiresAt.getTime())) return null
  const seconds = Math.max(0, Math.round((expiresAt.getTime() - now) / 1000))
  if (seconds >= 3600) return `${Math.round(seconds / 3600)} h`
  if (seconds >= 60) return `${Math.round(seconds / 60)} min`
  return `${seconds} s`
}

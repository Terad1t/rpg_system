// Contadores de pendências do painel do Master (ex.: solicitações novas),
// guardados no navegador e sincronizados entre componentes por evento.
const STORAGE_KEY = 'master-badges'
const EVENT_NAME = 'master-badges-updated'

export function getMasterBadges() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function setMasterBadges(badges) {
  const next = badges || {}
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Sem armazenamento disponível: o contador vale só até recarregar a página.
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }))
}

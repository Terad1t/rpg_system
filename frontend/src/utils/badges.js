export function getMasterBadges() {
  try {
    const raw = localStorage.getItem('master-badges')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function setMasterBadges(badges) {
  try {
    localStorage.setItem('master-badges', JSON.stringify(badges || {}))
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent('master-badges-updated', { detail: badges || {} }))
  } catch {}
}

export function onMasterBadgesUpdated(cb) {
  const handler = (e) => cb(e.detail || {})
  window.addEventListener('master-badges-updated', handler)
  return () => window.removeEventListener('master-badges-updated', handler)
}

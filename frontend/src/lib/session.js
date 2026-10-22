// Sessões ficam separadas por papel (master/player) para permitir abrir o
// painel do Master e o do jogador em abas diferentes do mesmo navegador.
// O papel ativo é o da rota atual (/master ou /player).

const ROLES = ['master', 'player']
const ACTIVE_ROLE_KEY = 'active_role'

const tokenKey = (role) => `token:${role}`
const userKey = (role) => `user:${role}`

function readStorage(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key, value) {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // Armazenamento indisponível (modo privado, cota): a sessão vale só nesta aba.
  }
}

export function roleFromPath(pathname = window.location.pathname) {
  if (pathname.startsWith('/master')) return 'master'
  if (pathname.startsWith('/player')) return 'player'
  return null
}

/** Lê o campo `exp` do JWT (sem validar a assinatura; quem valida é o servidor). */
export function tokenExpiresAt(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export function isTokenExpired(token, now = Date.now()) {
  const expiresAt = tokenExpiresAt(token)
  return expiresAt !== null && expiresAt <= now
}

function loadSession(role) {
  const token = readStorage(tokenKey(role))
  const rawUser = readStorage(userKey(role))
  if (!token || !rawUser) return null
  if (isTokenExpired(token)) {
    clearSession(role)
    return null
  }
  try {
    return { token, user: JSON.parse(rawUser) }
  } catch {
    return null
  }
}

/** Sessão para a rota atual; fora de /master e /player, a última usada. */
export function getSession(role = roleFromPath()) {
  if (role) return loadSession(role)
  const preferred = readStorage(ACTIVE_ROLE_KEY)
  const order = ROLES.includes(preferred) ? [preferred, ...ROLES.filter((r) => r !== preferred)] : ROLES
  for (const candidate of order) {
    const session = loadSession(candidate)
    if (session) return session
  }
  return null
}

export function getToken(role) {
  return getSession(role)?.token ?? null
}

export function saveSession({ token, user }) {
  writeStorage(tokenKey(user.role), token)
  writeStorage(userKey(user.role), JSON.stringify(user))
  writeStorage(ACTIVE_ROLE_KEY, user.role)
}

export function clearSession(role) {
  const roles = role ? [role] : ROLES
  for (const r of roles) {
    writeStorage(tokenKey(r), null)
    writeStorage(userKey(r), null)
  }
  if (!role || readStorage(ACTIVE_ROLE_KEY) === role) writeStorage(ACTIVE_ROLE_KEY, null)
}

/** Remove chaves de versões antigas (`token`/`user` sem papel). */
export function dropLegacySession() {
  writeStorage('token', null)
  writeStorage('user', null)
}

/** Chave do personagem escolhido pelo jogador (lembrado entre visitas). */
export function selectedCharacterKey(userId) {
  return `player-dashboard:selected-character:${userId ?? 'anon'}`
}

import type { Role, SessionUser } from '@/api/types'

// Sessões separadas por papel: o painel do Mestre e o do jogador podem ficar
// abertos em abas diferentes do mesmo navegador. O papel ativo é o da rota.

export interface Session {
  token: string
  user: SessionUser
}

const ROLES: Role[] = ['master', 'player']
const ACTIVE_ROLE_KEY = 'active_role'
const tokenKey = (role: Role) => `token:${role}`
const userKey = (role: Role) => `user:${role}`

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // Armazenamento indisponível (modo privado, cota): a sessão vale só nesta aba.
  }
}

export function roleFromPath(pathname = window.location.pathname): Role | null {
  if (pathname.startsWith('/mestre')) return 'master'
  if (pathname.startsWith('/jogador')) return 'player'
  return null
}

/** Lê `exp` do JWT, sem validar a assinatura (quem valida é o servidor). */
export function tokenExpiresAt(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export function isTokenExpired(token: string, now = Date.now()): boolean {
  const expiresAt = tokenExpiresAt(token)
  return expiresAt !== null && expiresAt <= now
}

function load(role: Role): Session | null {
  const token = read(tokenKey(role))
  const rawUser = read(userKey(role))
  if (!token || !rawUser) return null
  if (isTokenExpired(token)) {
    clearSession(role)
    return null
  }
  try {
    return { token, user: JSON.parse(rawUser) as SessionUser }
  } catch {
    return null
  }
}

/** Sessão da rota atual; fora de /mestre e /jogador, a última usada. */
export function getSession(role: Role | null = roleFromPath()): Session | null {
  if (role) return load(role)
  const preferred = read(ACTIVE_ROLE_KEY) as Role | null
  const order = preferred && ROLES.includes(preferred) ? [preferred, ...ROLES.filter((r) => r !== preferred)] : ROLES
  for (const candidate of order) {
    const session = load(candidate)
    if (session) return session
  }
  return null
}

export function getToken(): string | null {
  return getSession()?.token ?? null
}

export function saveSession(session: Session) {
  write(tokenKey(session.user.role), session.token)
  write(userKey(session.user.role), JSON.stringify(session.user))
  write(ACTIVE_ROLE_KEY, session.user.role)
}

export function clearSession(role?: Role | null) {
  for (const r of role ? [role] : ROLES) {
    write(tokenKey(r), null)
    write(userKey(r), null)
  }
  if (!role || read(ACTIVE_ROLE_KEY) === role) write(ACTIVE_ROLE_KEY, null)
}

/** Personagem escolhido pelo jogador (lembrado entre visitas). */
export function selectedCharacterKey(userId: number | undefined) {
  return `selected-character:${userId ?? 'anon'}`
}

export function readPreference(key: string): string | null {
  return read(key)
}

export function writePreference(key: string, value: string | null) {
  write(key, value)
}

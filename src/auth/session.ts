const STORAGE_KEY = 'lixta-auth-v1'

export type ApiUser = {
  id: number
  email: string
  name: string | null
  avatar_url: string | null
  cellphone: string | null
  created_at?: string
  updated_at?: string
  username?: string | null
}

export type AuthSession = {
  token: string
  user: ApiUser
}

let listeners: Array<() => void> = []

export function subscribeSession(cb: () => void): () => void {
  listeners.push(cb)
  return () => {
    listeners = listeners.filter((l) => l !== cb)
  }
}

export function emitSessionChange(): void {
  for (const l of listeners) l()
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

let cachedRaw: string | null | undefined
let cachedSession: AuthSession | null | undefined

function invalidateSessionCache(): void {
  cachedRaw = undefined
  cachedSession = undefined
}

function parseSession(raw: string | null): AuthSession | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as unknown
    if (
      v &&
      typeof v === 'object' &&
      'token' in v &&
      typeof (v as { token: unknown }).token === 'string' &&
      'user' in v &&
      typeof (v as { user: unknown }).user === 'object' &&
      (v as { user: unknown }).user !== null
    ) {
      const user = (v as AuthSession).user
      if (
        typeof user.id === 'number' &&
        typeof user.email === 'string'
      ) {
        return {
          token: (v as AuthSession).token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name ?? null,
            avatar_url: user.avatar_url ?? null,
            cellphone: user.cellphone ?? null,
            created_at: user.created_at,
            updated_at: user.updated_at,
            username: user.username ?? null,
          },
        }
      }
    }
  } catch {
    /* ignore */
  }
  return null
}

/**
 * Stable reference for the current stored session while storage is unchanged.
 * Required for useSyncExternalStore — JSON.parse would otherwise return a new object every read.
 */
export function getSessionSnapshot(): AuthSession | null {
  const raw = readRaw()
  if (raw === cachedRaw) return cachedSession ?? null
  cachedRaw = raw
  cachedSession = parseSession(raw)
  return cachedSession
}

export function getSession(): AuthSession | null {
  return getSessionSnapshot()
}

export function getToken(): string | null {
  return getSession()?.token ?? null
}

export function setSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  invalidateSessionCache()
  emitSessionChange()
}

export function updateStoredUser(partial: Partial<ApiUser>): void {
  const cur = getSessionSnapshot()
  if (!cur) return
  setSession({
    token: cur.token,
    user: { ...cur.user, ...partial },
  })
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  invalidateSessionCache()
  emitSessionChange()
}

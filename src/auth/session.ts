const STORAGE_KEY = 'signals-demo-session-v1'

export type DemoSession = {
  email: string
  name: string
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

let cachedRaw: string | null | undefined
let cachedSession: DemoSession | null | undefined

function invalidateSessionCache() {
  cachedRaw = undefined
  cachedSession = undefined
}

function parseSession(raw: string | null): DemoSession | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw) as unknown
    if (
      v &&
      typeof v === 'object' &&
      'email' in v &&
      typeof (v as { email: unknown }).email === 'string' &&
      'name' in v &&
      typeof (v as { name: unknown }).name === 'string'
    ) {
      return { email: (v as DemoSession).email, name: (v as DemoSession).name }
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
export function getSessionSnapshot(): DemoSession | null {
  const raw = readRaw()
  if (raw === cachedRaw) return cachedSession ?? null
  cachedRaw = raw
  cachedSession = parseSession(raw)
  return cachedSession
}

export function getSession(): DemoSession | null {
  return getSessionSnapshot()
}

export function signIn(email: string, password: string): DemoSession {
  void email
  void password
  const session: DemoSession = {
    email: 'you@posthog.app',
    name: 'Signals Operator',
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  invalidateSessionCache()
  return session
}

export function signOut(): void {
  localStorage.removeItem(STORAGE_KEY)
  invalidateSessionCache()
}

/*
 * Clerk / Auth.js seam:
 * - Wrap the app with <ClerkProvider> (or SessionProvider) in src/routes/__root.tsx instead of/in addition to AuthProvider.
 * - Replace getSession() with Clerk's useAuth().isSignedIn + user, or Auth.js getServerSession on SSR routes.
 * - In _authenticated.tsx beforeLoad, call Clerk's auth() helper or redirect() when unauthenticated.
 */

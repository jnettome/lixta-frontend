import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  type DemoSession,
  getSessionSnapshot,
  signIn,
  signOut as sessionSignOut,
} from '@/auth/session'

type AuthState = {
  session: DemoSession | null
  signIn: (email: string, password: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)

let listeners: Array<() => void> = []

function subscribe(cb: () => void) {
  listeners.push(cb)
  return () => {
    listeners = listeners.filter((l) => l !== cb)
  }
}

function emit() {
  for (const l of listeners) l()
}

function getSnapshot(): DemoSession | null {
  return getSessionSnapshot()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const doSignIn = useCallback((email: string, password: string) => {
    signIn(email, password)
    emit()
  }, [])

  const doSignOut = useCallback(() => {
    sessionSignOut()
    emit()
  }, [])

  const value = useMemo(
    () => ({
      session,
      signIn: doSignIn,
      signOut: doSignOut,
    }),
    [session, doSignIn, doSignOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  type AuthSession,
  clearAuthSession,
  getSessionSnapshot,
  setSession,
  subscribeSession,
  updateStoredUser,
} from '@/auth/session'
import { ApiError } from '@/lib/api'
import { getMe, loginRequest, logoutRequest } from '@/services/auth-api'

export type SignInResult =
  | { status: 'success' }
  | { status: 'otp_required' }
  | { status: 'error'; message: string }

type AuthState = {
  session: AuthSession | null
  signIn: (email: string, otp: string) => Promise<SignInResult>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function getSnapshot(): AuthSession | null {
  return getSessionSnapshot()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribeSession, getSnapshot, getSnapshot)

  const doSignIn = useCallback(async (email: string, otp: string): Promise<SignInResult> => {
    try {
      const { user, token } = await loginRequest(email.trim().toLowerCase(), otp)
      setSession({ token, user })
      return { status: 'success' }
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 400) return { status: 'otp_required' }
        if (e.status === 403) {
          return { status: 'error', message: 'Invalid code or this email is not registered.' }
        }
        return { status: 'error', message: e.message }
      }
      return { status: 'error', message: e instanceof Error ? e.message : 'Sign-in failed' }
    }
  }, [])

  const doSignOut = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      /* still clear local session */
    } finally {
      clearAuthSession()
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const user = await getMe()
    updateStoredUser(user)
  }, [])

  const value = useMemo(
    () => ({
      session,
      signIn: doSignIn,
      signOut: doSignOut,
      refreshUser,
    }),
    [session, doSignIn, doSignOut, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

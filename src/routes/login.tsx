import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { useAuth } from '@/auth/AuthContext'
import { getSession } from '@/auth/session'
import { cn } from '@/lib/utils'

const loginSearchSchema = z.object({
  otp_code: z.string().optional(),
  email: z.string().optional(),
})

export type LoginSearch = z.infer<typeof loginSearchSchema>

export const Route = createFileRoute('/login')({
  validateSearch: (raw): LoginSearch => {
    const parsed = loginSearchSchema.safeParse(raw)
    return parsed.success ? parsed.data : {}
  },
  beforeLoad: () => {
    if (getSession()?.token) throw redirect({ to: '/dashboard' })
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autoTriedRef = useRef(false)

  useEffect(() => {
    const qEmail = search.email?.trim()
    const qOtp = search.otp_code?.trim()
    if (!qEmail || !qOtp || autoTriedRef.current) return
    autoTriedRef.current = true
    setEmail(qEmail)
    setOtp(qOtp)
    void submitSignIn(qEmail, qOtp)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot from URL
  }, [search.email, search.otp_code])

  async function submitSignIn(emailVal: string, otpVal: string) {
    setError(null)
    setLoading(true)
    try {
      const result = await signIn(emailVal, otpVal)
      if (result.status === 'success') {
        void navigate({ to: '/dashboard' })
        return
      }
      if (result.status === 'otp_required') {
        setEmailSent(true)
        setShowOtp(true)
        return
      }
      setError(result.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-surface-0 px-4 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
      <div
        className={cn(
          'w-full max-w-sm rounded-lg border border-border bg-surface-1 p-8 shadow-xl',
        )}
      >
        <h1 className="text-lg font-semibold tracking-tight text-fg">Signals</h1>
        <p className="mt-1 text-sm text-muted">
          Sign in with email. We will send a one-time code to your inbox.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (emailSent && !showOtp) return
            void submitSignIn(email, emailSent && showOtp ? otp : '')
          }}
        >
          {!emailSent ? (
            <label className="block text-xs font-medium text-muted">
              Email
              <input
                className="mt-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none ring-nav-active/40 focus:ring-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="username"
                required
              />
            </label>
          ) : (
            <div className="space-y-3 text-sm text-muted">
              <p>Check your inbox for a sign-in code sent to {email}.</p>
              {!showOtp ? (
                <button
                  type="button"
                  className="text-sm font-medium text-nav-active hover:underline"
                  onClick={() => setShowOtp(true)}
                >
                  Enter code manually
                </button>
              ) : null}
            </div>
          )}

          {emailSent && showOtp ? (
            <label className="block text-xs font-medium text-muted">
              One-time code
              <input
                className="mt-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none ring-nav-active/40 focus:ring-2"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoComplete="one-time-code"
                required
              />
            </label>
          ) : null}

          {error ? <p className="text-xs text-red-500">{error}</p> : null}

          {emailSent && !showOtp ? null : (
            <button
              type="submit"
              disabled={
                loading ||
                (!emailSent && !email.trim()) ||
                (emailSent && showOtp && !otp.trim())
              }
              className="w-full rounded-md bg-nav-active px-3 py-2 text-sm font-medium text-nav-active-fg transition hover:opacity-90 disabled:opacity-50"
            >
              {loading
                ? 'Please wait…'
                : !emailSent
                  ? 'Send sign-in code'
                  : 'Confirm code'}
            </button>
          )}

          {emailSent ? (
            <button
              type="button"
              className="w-full text-center text-xs text-muted hover:text-fg"
              onClick={() => {
                setEmailSent(false)
                setShowOtp(false)
                setOtp('')
                setError(null)
              }}
            >
              Use a different email
            </button>
          ) : null}
        </form>
      </div>
    </div>
  )
}

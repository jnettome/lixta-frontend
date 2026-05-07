import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { getSession } from '@/auth/session'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (getSession()) throw redirect({ to: '/inbox', search: { view: 'split' } })
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('demo@signals.app')
  const [password, setPassword] = useState('anything')

  return (
    <div className="flex min-h-full items-center justify-center bg-surface-0 p-6">
      <div
        className={cn(
          'w-full max-w-sm rounded-lg border border-border bg-surface-1 p-8 shadow-xl',
        )}
      >
        <h1 className="text-lg font-semibold tracking-tight text-fg">Signals</h1>
        <p className="mt-1 text-sm text-muted">Demo sign-in — password is ignored.</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            signIn(email, password)
            void navigate({ to: '/inbox', search: { view: 'split' } })
          }}
        >
          <label className="block text-xs font-medium text-muted">
            Email
            <input
              className="mt-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none ring-nav-active/40 focus:ring-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="block text-xs font-medium text-muted">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none ring-nav-active/40 focus:ring-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-nav-active px-3 py-2 text-sm font-medium text-nav-active-fg transition hover:opacity-90"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}

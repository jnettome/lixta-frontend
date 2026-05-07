import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '@/auth/session'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (getSession()?.token) throw redirect({ to: '/dashboard' })
    throw redirect({ to: '/login' })
  },
  component: () => null,
})

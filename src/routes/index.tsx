import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '@/auth/session'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (getSession()) throw redirect({ to: '/inbox', search: { view: 'split' } })
    throw redirect({ to: '/login' })
  },
  component: () => null,
})

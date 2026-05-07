import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '@/auth/session'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    if (!getSession()?.token) throw redirect({ to: '/login' })
  },
  component: () => <Outlet />,
})

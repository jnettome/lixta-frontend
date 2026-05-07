import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { AuthProvider } from '@/auth/AuthContext'
import { RootRouteError } from '@/components/RootRouteError'

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RootRouteError,
})

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </AuthProvider>
  )
}

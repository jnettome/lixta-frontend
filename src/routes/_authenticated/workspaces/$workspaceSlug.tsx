import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Link, Outlet, createFileRoute, useRouter, useRouterState } from '@tanstack/react-router'

import { MobileNavDrawer } from '@/components/shell/MobileNavDrawer'
import { Sidebar, SidebarNav } from '@/components/shell/Sidebar'
import { WorkspaceMobileHeader } from '@/components/shell/WorkspaceMobileHeader'
import { WorkspaceLayoutProvider, type WorkspaceOutletContextValue } from '@/context/WorkspaceLayoutContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { WorkspaceDetail } from '@/services/workspaces-api'
import { getWorkspace } from '@/services/workspaces-api'
import { listWorkspaceUsers } from '@/services/workspace-users-api'

export const Route = createFileRoute('/_authenticated/workspaces/$workspaceSlug')({
  component: WorkspaceLayout,
  loader: async ({ params }) => {
    const slug = params.workspaceSlug
    const [workspace, members] = await Promise.all([
      getWorkspace(slug),
      listWorkspaceUsers(slug),
    ])
    return { workspace, members, slug }
  },
  errorComponent: ({ error }) => {
    const message =
      error instanceof ApiError
        ? error.status === 404
          ? 'Workspace not found or you do not have access.'
          : error.message
        : error instanceof Error
          ? error.message
          : 'Could not load workspace'
    return (
      <div className="min-h-full bg-surface-0 px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-lg rounded-xl border border-border bg-surface-1 p-8 text-center shadow-sm">
          <p className="text-sm text-muted">{message}</p>
          <Link
            to="/dashboard"
            className="mt-4 inline-block text-sm font-medium text-nav-active hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  },
})

function WorkspaceLayout() {
  const router = useRouter()
  const data = Route.useLoaderData()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const { workspace, members } = data

  const refreshWorkspace = useCallback(async () => {
    await router.invalidate()
  }, [router])

  const openWorkspaceMobileNav = useCallback(() => setMobileNavOpen(true), [])

  const ctx = useMemo(
    () =>
      ({
        workspaceSlug: workspace.slug,
        workspace,
        members,
        refreshWorkspace,
        openWorkspaceMobileNav,
      }) satisfies WorkspaceOutletContextValue,
    [workspace, members, refreshWorkspace, openWorkspaceMobileNav],
  )

  const slug = workspace.slug
  const trimmed = pathname.replace(/\/+$/, '')
  const isUsersRoute = trimmed.endsWith('/users')

  return (
    <WorkspaceShell
      isUsersRoute={isUsersRoute}
      slug={slug}
      workspace={workspace}
      mobileNavOpen={mobileNavOpen}
      onMobileNavOpenChange={setMobileNavOpen}
    >
      <WorkspaceLayoutProvider value={ctx}>
        <Outlet />
      </WorkspaceLayoutProvider>
    </WorkspaceShell>
  )
}

function WorkspaceShell({
  slug,
  workspace,
  isUsersRoute,
  children,
  mobileNavOpen,
  onMobileNavOpenChange,
}: {
  slug: string
  workspace: WorkspaceDetail
  isUsersRoute: boolean
  children: ReactNode
  mobileNavOpen: boolean
  onMobileNavOpenChange: (open: boolean) => void
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isLg = useMediaQuery('(min-width: 1024px)')

  useEffect(() => {
    if (!isLg) return
    const id = requestAnimationFrame(() => onMobileNavOpenChange(false))
    return () => cancelAnimationFrame(id)
  }, [isLg, onMobileNavOpenChange])

  const isBoardRoute = /\/boards\//.test(pathname)

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-x-hidden bg-surface-0 lg:flex-row">
      {!isBoardRoute ? (
        <WorkspaceMobileHeader
          workspaceName={workspace.name}
          workspaceSlug={slug}
          onOpenNav={() => onMobileNavOpenChange(true)}
        />
      ) : null}

      <MobileNavDrawer open={mobileNavOpen} onOpenChange={onMobileNavOpenChange}>
        <SidebarNav
          dashboardActive={false}
          signalsActive={false}
          workspacesActive
          variant="drawer"
          workspaceSlug={slug}
          workspaceBoards={workspace.boards}
          onNavigate={() => onMobileNavOpenChange(false)}
        />
      </MobileNavDrawer>

      <Sidebar
        dashboardActive={false}
        signalsActive={false}
        workspacesActive
        workspaceSlug={slug}
        workspaceBoards={workspace.boards}
      />

      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col',
          !isBoardRoute && 'pb-[env(safe-area-inset-bottom)] lg:pb-0',
        )}
      >
        <div
          className={cn(
            'hidden shrink-0 border-b border-border bg-surface-0 px-4 py-4 sm:px-6 lg:block',
            'pt-[max(1rem,env(safe-area-inset-top))]',
            isBoardRoute && 'lg:hidden',
          )}
        >
          <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <Link to="/dashboard" className="font-medium hover:text-fg">
              Dashboard
            </Link>
            <span aria-hidden>/</span>
            <span className="truncate font-medium text-fg">{workspace.name}</span>
          </nav>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{workspace.name}</h1>
              {workspace.description ? (
                <p className="mt-1 max-w-2xl text-sm text-muted">{String(workspace.description)}</p>
              ) : (
                <p className="mt-1 font-mono text-sm text-muted">/{slug}</p>
              )}
            </div>

            <div className="flex shrink-0 gap-6 border-t border-border pt-4 sm:border-t-0 sm:pt-0">
              <div className="flex gap-2 rounded-lg bg-surface-1 p-1 ring-1 ring-border">
                <Link
                  to="/workspaces/$workspaceSlug"
                  params={{ workspaceSlug: slug }}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition',
                    !isUsersRoute
                      ? 'bg-nav-active/20 text-nav-active-fg ring-1 ring-nav-active/35'
                      : 'text-muted hover:text-fg',
                  )}
                >
                  Overview
                </Link>
                <Link
                  to="/workspaces/$workspaceSlug/users"
                  params={{ workspaceSlug: slug }}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition',
                    isUsersRoute
                      ? 'bg-nav-active/20 text-nav-active-fg ring-1 ring-nav-active/35'
                      : 'text-muted hover:text-fg',
                  )}
                >
                  Members
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'relative min-h-0 min-w-0 flex-1 overflow-x-hidden bg-surface-0',
            isBoardRoute ? 'flex flex-col overflow-hidden' : 'overflow-y-auto',
          )}
        >
          <div
            className={
              isBoardRoute
                ? 'flex min-h-0 min-w-0 flex-1 flex-col p-0'
                : 'min-h-0 px-4 pb-10 pt-4 sm:px-6 sm:pb-12 sm:pt-6'
            }
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

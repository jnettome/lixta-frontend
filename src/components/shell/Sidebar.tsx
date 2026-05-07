import * as Collapsible from '@radix-ui/react-collapsible'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ChevronDown,
  ChevronRight,
  Filter,
  LayoutDashboard,
  LayoutGrid,
  Plus,
  Radio,
  Sparkles,
  TerminalSquare,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/lib/utils'

export type SidebarVariant = 'rail' | 'drawer'

type SidebarNavProps = {
  dashboardActive?: boolean
  signalsActive?: boolean
  variant?: SidebarVariant
  className?: string
  onNavigate?: () => void
}

export function SidebarNav({
  dashboardActive = false,
  signalsActive = false,
  variant = 'rail',
  className,
  onNavigate,
}: SidebarNavProps) {
  const navigate = useNavigate()
  const { session, signOut } = useAuth()

  function userInitials(): string {
    const email = session?.user.email ?? ''
    const n = session?.user.name?.trim()
    if (n) {
      return n
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    }
    return email ? email.slice(0, 2).toUpperCase() : '—'
  }

  const displayName = session?.user.name?.trim() || session?.user.email || 'Account'
  const [tasksOpen, setTasksOpen] = useState(true)
  const isDrawer = variant === 'drawer'
  const touch = isDrawer ? 'min-h-[48px] items-center' : ''

  const afterNav = () => onNavigate?.()

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col bg-surface-1',
        isDrawer && 'pt-[env(safe-area-inset-top)]',
        className,
      )}
    >
      {!isDrawer ? (
        <div className="flex h-10 shrink-0 items-center gap-2 px-3 pt-2">
          <span className="inline-flex gap-1.5" aria-hidden>
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </span>
        </div>
      ) : (
        <div className="shrink-0 border-b border-border px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">LIXTA</p>
          <p className="text-sm font-medium text-fg">Workspace</p>
        </div>
      )}

      <div className={cn('px-3 pb-2', isDrawer && 'px-4 pt-2')}>
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-fg transition hover:bg-surface-3',
            touch,
          )}
        >
          <Plus className="size-4 opacity-80" />
          New task
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-4 overscroll-contain">
        <Link
          to="/dashboard"
          onClick={afterNav}
          className={cn(
            'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition',
            touch,
            dashboardActive
              ? 'bg-nav-active/25 text-nav-active-fg ring-1 ring-nav-active/40'
              : 'text-muted hover:bg-surface-2 hover:text-fg',
          )}
        >
          <LayoutDashboard className="size-4 shrink-0 opacity-90" />
          <span className="flex-1 text-left">Dashboard</span>
        </Link>
        <Link
          to="/signals"
          search={{ view: 'split' }}
          onClick={afterNav}
          className={cn(
            'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition',
            touch,
            signalsActive
              ? 'bg-nav-active/25 text-nav-active-fg ring-1 ring-nav-active/40'
              : 'text-muted hover:bg-surface-2 hover:text-fg',
          )}
        >
          <Radio className="size-4 shrink-0 opacity-90" />
          <span className="flex-1 text-left">Signals</span>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
            62
          </span>
        </Link>

        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-muted transition hover:bg-surface-2 hover:text-fg',
            touch,
          )}
        >
          <TerminalSquare className="size-4 shrink-0 opacity-80" />
          Command Center
        </button>
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-muted transition hover:bg-surface-2 hover:text-fg',
            touch,
          )}
        >
          <Sparkles className="size-4 shrink-0 opacity-80" />
          Skills
        </button>

        <Collapsible.Root open={tasksOpen} onOpenChange={setTasksOpen} className="pt-3">
          <div className="flex items-center gap-1 px-1">
            <Collapsible.Trigger className="flex flex-1 items-center gap-1 rounded px-1 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted hover:text-fg">
              {tasksOpen ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
              Tasks
            </Collapsible.Trigger>
            <button
              type="button"
              className="rounded p-1 text-muted hover:bg-surface-2 hover:text-fg"
              aria-label="Filter tasks"
            >
              <Filter className="size-3.5" />
            </button>
          </div>
          <Collapsible.Content className="mt-1 space-y-0.5 pl-1">
            <div className="rounded-md px-2 py-1.5 text-xs font-medium text-muted">posthog.com</div>
            {['Insights backlog', 'Session quality', 'Billing alerts'].map((label, i) => (
              <button
                key={label}
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-muted transition hover:bg-surface-2 hover:text-fg',
                  isDrawer && 'min-h-11',
                )}
              >
                <LayoutGrid className="size-3.5 shrink-0 opacity-70" />
                <span className="flex-1 truncate">{label}</span>
                <span className="shrink-0 text-[10px] text-muted/80">{4 + i * 5}h</span>
              </button>
            ))}
          </Collapsible.Content>
        </Collapsible.Root>
      </nav>

      <div className="mt-auto border-t border-border p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition hover:bg-surface-2',
                isDrawer && 'min-h-12',
              )}
            >
              {session?.user.avatar_url ? (
                <img
                  src={session.user.avatar_url}
                  alt=""
                  className="size-8 shrink-0 rounded-md object-cover"
                />
              ) : (
                <span className="flex size-8 shrink-0 items-center justify-center rounded bg-surface-3 text-[10px] font-bold text-fg">
                  {userInitials()}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-fg">{displayName}</span>
                <span className="block truncate text-[11px] text-muted">
                  {session?.user.email ?? '—'}
                </span>
              </span>
              <ChevronDown className="size-4 shrink-0 text-muted" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-[60] min-w-[200px] rounded-md border border-border bg-surface-2 p-1 shadow-lg"
              sideOffset={6}
            >
              <DropdownMenu.Item
                className="cursor-pointer rounded px-2 py-1.5 text-xs text-fg outline-none hover:bg-surface-3"
                onSelect={() => {
                  afterNav()
                  void navigate({ to: '/account' })
                }}
              >
                Profile
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="cursor-pointer rounded px-2 py-1.5 text-xs text-fg outline-none hover:bg-surface-3"
                onSelect={() => {
                  void (async () => {
                    await signOut()
                    void navigate({ to: '/login' })
                  })()
                }}
              >
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  )
}

type SidebarProps = {
  dashboardActive?: boolean
  signalsActive?: boolean
  className?: string
}

export function Sidebar({
  dashboardActive = false,
  signalsActive = false,
  className,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'hidden h-full min-h-0 w-[260px] shrink-0 flex-col border-r border-border bg-surface-1 lg:flex lg:flex-col',
        className,
      )}
    >
      <SidebarNav
        dashboardActive={dashboardActive}
        signalsActive={signalsActive}
        variant="rail"
      />
    </aside>
  )
}

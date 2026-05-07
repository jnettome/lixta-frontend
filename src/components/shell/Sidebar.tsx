import * as Collapsible from '@radix-ui/react-collapsible'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ChevronDown,
  ChevronRight,
  Filter,
  Inbox,
  LayoutGrid,
  Plus,
  Sparkles,
  TerminalSquare,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/lib/utils'

type SidebarProps = {
  inboxActive?: boolean
}

export function Sidebar({ inboxActive = true }: SidebarProps) {
  const navigate = useNavigate()
  const { session, signOut } = useAuth()
  const [tasksOpen, setTasksOpen] = useState(true)

  return (
    <aside className="flex h-full min-h-0 w-[260px] shrink-0 flex-col border-r border-border bg-surface-1">
      <div className="flex h-10 shrink-0 items-center gap-2 px-3 pt-2">
        <span className="inline-flex gap-1.5" aria-hidden>
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </span>
      </div>

      <div className="px-3 pb-2">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-fg transition hover:bg-surface-3"
        >
          <Plus className="size-4 opacity-80" />
          New task
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-4">
        <Link
          to="/inbox"
          search={{ view: 'split' }}
          className={cn(
            'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition',
            inboxActive
              ? 'bg-nav-active/25 text-nav-active-fg ring-1 ring-nav-active/40'
              : 'text-muted hover:bg-surface-2 hover:text-fg',
          )}
        >
          <Inbox className="size-4 shrink-0 opacity-90" />
          <span className="flex-1 text-left">Inbox</span>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
            62
          </span>
        </Link>

        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-muted transition hover:bg-surface-2 hover:text-fg"
        >
          <TerminalSquare className="size-4 shrink-0 opacity-80" />
          Command Center
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-muted transition hover:bg-surface-2 hover:text-fg"
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
            <div className="rounded-md px-2 py-1.5 text-xs font-medium text-muted">
              posthog.com
            </div>
            {['Insights backlog', 'Session quality', 'Billing alerts'].map((label, i) => (
              <button
                key={label}
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-muted transition hover:bg-surface-2 hover:text-fg"
              >
                <LayoutGrid className="size-3.5 shrink-0 opacity-70" />
                <span className="flex-1 truncate">{label}</span>
                <span className="shrink-0 text-[10px] text-muted/80">{4 + i * 5}h</span>
              </button>
            ))}
          </Collapsible.Content>
        </Collapsible.Root>
      </nav>

      <div className="mt-auto border-t border-border p-2">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition hover:bg-surface-2"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded bg-surface-3 text-[10px] font-bold text-fg">
                PH
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-fg">PostHog App + Website</span>
                <span className="block truncate text-[11px] text-muted">
                  {session?.email ?? '—'}
                </span>
              </span>
              <ChevronDown className="size-4 shrink-0 text-muted" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[200px] rounded-md border border-border bg-surface-2 p-1 shadow-lg"
              sideOffset={6}
            >
              <DropdownMenu.Item
                className="cursor-pointer rounded px-2 py-1.5 text-xs text-fg outline-none hover:bg-surface-3"
                onSelect={() => {
                  signOut()
                  void navigate({ to: '/login' })
                }}
              >
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </aside>
  )
}

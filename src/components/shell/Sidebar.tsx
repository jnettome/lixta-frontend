import * as Collapsible from '@radix-ui/react-collapsible'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { ChevronDown, ChevronRight, Kanban, LayoutDashboard, LayoutGrid, List, Plus, Radio } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/lib/utils'

export type WorkspaceBoardNavItem = {
  id: number
  name?: string | null
  tasks_count?: number
  archived?: boolean
}

export type SidebarVariant = 'rail' | 'drawer'

type SidebarNavProps = {
  dashboardActive?: boolean
  signalsActive?: boolean
  workspacesActive?: boolean
  /** When set (e.g. workspace layout), show workspace boards in the rail */
  workspaceSlug?: string
  workspaceBoards?: WorkspaceBoardNavItem[]
  variant?: SidebarVariant
  className?: string
  onNavigate?: () => void
}

type BoardNavCollapsibleProps = {
  board: WorkspaceBoardNavItem
  workspaceSlug: string
  activeBoardId: string | undefined
  boardView: 'list' | 'kanban'
  open: boolean
  onOpenChange: (open: boolean) => void
  isDrawer: boolean
  afterNav: () => void
}

function BoardNavCollapsible({
  board,
  workspaceSlug,
  activeBoardId,
  boardView,
  open,
  onOpenChange,
  isDrawer,
  afterNav,
}: BoardNavCollapsibleProps) {
  const idStr = String(board.id)
  const title = (board.name ?? 'Board').trim() || 'Board'
  return (
    <Collapsible.Root open={open} onOpenChange={onOpenChange}>
      <Collapsible.Trigger
        className={cn(
          'flex w-full items-center gap-1 rounded-md px-1.5 py-1.5 text-left text-xs font-medium text-fg transition hover:bg-surface-2',
          isDrawer && 'min-h-11',
        )}
      >
        {open ? (
          <ChevronDown className="size-3.5 shrink-0 text-muted" aria-hidden />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-muted" aria-hidden />
        )}
        <span className="min-w-0 flex-1 truncate text-left">{title}</span>
        {typeof board.tasks_count === 'number' ? (
          <span className="shrink-0 tabular-nums text-[10px] text-muted/90">{board.tasks_count}</span>
        ) : null}
      </Collapsible.Trigger>
      <Collapsible.Content className="mt-0.5 space-y-0.5 border-l border-border/70 pl-2 ml-2.5">
        <Link
          to="/workspaces/$workspaceSlug/boards/$boardId"
          params={{ workspaceSlug, boardId: idStr }}
          search={{ view: 'list' }}
          onClick={afterNav}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition',
            isDrawer && 'min-h-10',
            activeBoardId === idStr && boardView === 'list'
              ? 'bg-nav-active/20 text-nav-active-fg ring-1 ring-nav-active/35'
              : 'text-muted hover:bg-surface-2 hover:text-fg',
          )}
        >
          <List className="size-3.5 shrink-0 opacity-90" aria-hidden />
          List
        </Link>
        <Link
          to="/workspaces/$workspaceSlug/boards/$boardId"
          params={{ workspaceSlug, boardId: idStr }}
          search={{ view: 'kanban' }}
          onClick={afterNav}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition',
            isDrawer && 'min-h-10',
            activeBoardId === idStr && boardView === 'kanban'
              ? 'bg-nav-active/20 text-nav-active-fg ring-1 ring-nav-active/35'
              : 'text-muted hover:bg-surface-2 hover:text-fg',
          )}
        >
          <Kanban className="size-3.5 shrink-0 opacity-90" aria-hidden />
          Kanban
        </Link>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

export function SidebarNav({
  dashboardActive = false,
  signalsActive = false,
  workspacesActive = false,
  workspaceSlug,
  workspaceBoards,
  variant = 'rail',
  className,
  onNavigate,
}: SidebarNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const searchStr = useRouterState({ select: (s) => s.location.search })
  const activeBoardId = useMemo(
    () => /\/workspaces\/[^/]+\/boards\/(\d+)/.exec(pathname)?.[1],
    [pathname],
  )
  const boardView = useMemo(
    () => (new URLSearchParams(searchStr).get('view') === 'kanban' ? 'kanban' : 'list'),
    [searchStr],
  )

  const navigate = useNavigate()
  const { session, signOut } = useAuth()

  const boards = workspaceBoards ?? []
  const activeBoards = useMemo(() => boards.filter((b) => !b.archived), [boards])
  const archivedBoards = useMemo(() => boards.filter((b) => b.archived), [boards])
  const showBoardsSection = Boolean(workspaceSlug && boards.length > 0)

  const [openBoardIds, setOpenBoardIds] = useState<Record<string, boolean>>({})
  const [archivedOpen, setArchivedOpen] = useState(false)

  useEffect(() => {
    if (!activeBoardId) return
    setOpenBoardIds((prev) => ({ ...prev, [activeBoardId]: true }))
    const active = boards.find((b) => String(b.id) === activeBoardId)
    if (active?.archived) setArchivedOpen(true)
  }, [activeBoardId, boards])

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
        <Link
          to="/dashboard"
          onClick={afterNav}
          className={cn(
            'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition',
            touch,
            workspacesActive
              ? 'bg-nav-active/25 text-nav-active-fg ring-1 ring-nav-active/40'
              : 'text-muted hover:bg-surface-2 hover:text-fg',
          )}
        >
          <LayoutGrid className="size-4 shrink-0 opacity-90" />
          <span className="flex-1 text-left">Workspaces</span>
        </Link>

        {showBoardsSection && workspaceSlug ? (
          <div className="pt-3">
            {activeBoards.length > 0 ? (
              <>
                <p className="px-1.5 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Boards</p>
                <div className="space-y-1">
                  {activeBoards.map((b) => (
                    <BoardNavCollapsible
                      key={b.id}
                      board={b}
                      workspaceSlug={workspaceSlug}
                      activeBoardId={activeBoardId}
                      boardView={boardView}
                      open={openBoardIds[String(b.id)] ?? false}
                      onOpenChange={(open) =>
                        setOpenBoardIds((prev) => ({ ...prev, [String(b.id)]: open }))
                      }
                      isDrawer={isDrawer}
                      afterNav={afterNav}
                    />
                  ))}
                </div>
              </>
            ) : null}

            {archivedBoards.length > 0 ? (
              <div
                className={cn(
                  activeBoards.length > 0 ? 'mt-4 border-t border-border pt-3' : 'pt-1',
                )}
              >
                <Collapsible.Root open={archivedOpen} onOpenChange={setArchivedOpen}>
                  <Collapsible.Trigger
                    className={cn(
                      'flex w-full items-center gap-1 rounded-md px-1.5 py-1.5 text-left text-xs font-medium text-muted transition hover:bg-surface-2 hover:text-fg',
                      isDrawer && 'min-h-11',
                    )}
                  >
                    {archivedOpen ? (
                      <ChevronDown className="size-3.5 shrink-0" aria-hidden />
                    ) : (
                      <ChevronRight className="size-3.5 shrink-0" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 truncate text-left font-semibold uppercase tracking-wide">
                      Archived boards
                    </span>
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted">
                      {archivedBoards.length}
                    </span>
                  </Collapsible.Trigger>
                  <Collapsible.Content className="mt-2 space-y-1">
                    {archivedBoards.map((b) => (
                      <BoardNavCollapsible
                        key={b.id}
                        board={b}
                        workspaceSlug={workspaceSlug}
                        activeBoardId={activeBoardId}
                        boardView={boardView}
                        open={openBoardIds[String(b.id)] ?? false}
                        onOpenChange={(open) =>
                          setOpenBoardIds((prev) => ({ ...prev, [String(b.id)]: open }))
                        }
                        isDrawer={isDrawer}
                        afterNav={afterNav}
                      />
                    ))}
                  </Collapsible.Content>
                </Collapsible.Root>
              </div>
            ) : null}
          </div>
        ) : null}
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
  workspacesActive?: boolean
  workspaceSlug?: string
  workspaceBoards?: WorkspaceBoardNavItem[]
  className?: string
}

export function Sidebar({
  dashboardActive = false,
  signalsActive = false,
  workspacesActive = false,
  workspaceSlug,
  workspaceBoards,
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
        workspacesActive={workspacesActive}
        workspaceSlug={workspaceSlug}
        workspaceBoards={workspaceBoards}
        variant="rail"
      />
    </aside>
  )
}

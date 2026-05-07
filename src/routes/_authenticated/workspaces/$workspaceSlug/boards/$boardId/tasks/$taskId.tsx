import { createFileRoute, useNavigate, useRouterState } from '@tanstack/react-router'
import { Maximize2, Minimize2, X } from 'lucide-react'

import { MarkdownBody } from '@/components/markdown/MarkdownBody'
import { useBoardLayout } from '@/context/BoardLayoutContext'
import { useBoardTaskPanel } from '@/context/BoardTaskPanelContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatBoardDueAt } from '@/lib/board-ui'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/workspaces/$workspaceSlug/boards/$boardId/tasks/$taskId')({
  component: BoardTaskDetailRoute,
})

function BoardTaskDetailRoute() {
  const { taskId } = Route.useParams()
  const { board, workspaceSlug, boardId } = useBoardLayout()
  const { panelView, setPanelView } = useBoardTaskPanel()
  const navigate = useNavigate()
  const isLg = useMediaQuery('(min-width: 1024px)')
  const search = useRouterState({
    select: (s) => s.location.search as { view?: 'list' | 'kanban' },
  })
  const view = search.view ?? 'list'

  const task = board.board_columns
    ?.flatMap((c) => c.tasks ?? [])
    .find((t) => String(t.id) === taskId)

  const column = board.board_columns?.find((c) =>
    (c.tasks ?? []).some((t) => String(t.id) === taskId),
  )

  const close = () => {
    void navigate({
      to: '/workspaces/$workspaceSlug/boards/$boardId',
      params: { workspaceSlug, boardId },
      search: { view },
    })
  }

  if (!task) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-muted">Task not found on this board.</p>
        <button
          type="button"
          className="text-sm font-medium text-nav-active hover:underline"
          onClick={close}
        >
          Back to board
        </button>
      </div>
    )
  }

  const bodyMd = typeof task.body === 'string' ? task.body.trim() : ''
  const dueLabel = formatBoardDueAt(task.due_at ?? null)

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-1">
      <header className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
        <p className="min-w-0 flex-1 pt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
          {column?.name?.trim() ?? 'Task'}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          {isLg ? (
            <button
              type="button"
              className="rounded-md p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg"
              aria-label={panelView === 'full' ? 'Exit full view' : 'Open full view'}
              onClick={() => setPanelView(panelView === 'full' ? 'split' : 'full')}
            >
              {panelView === 'full' ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-md p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg"
            aria-label="Close task"
            onClick={close}
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      <article className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
        <h1 className="text-lg font-semibold tracking-tight text-fg sm:text-xl">
          {(task.name ?? '').trim() || 'Untitled task'}
        </h1>
        {dueLabel ? (
          <p className="mt-3 text-sm text-muted">Due {dueLabel}</p>
        ) : (
          <p className="mt-3 text-sm text-muted">No due date</p>
        )}
        {bodyMd ? (
          <div className={cn('mt-6 min-w-0', panelView === 'full' ? 'max-w-3xl' : 'max-w-prose')}>
            <MarkdownBody markdown={bodyMd} />
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">No description.</p>
        )}
      </article>
    </div>
  )
}

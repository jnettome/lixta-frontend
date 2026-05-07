import { Link, useRouterState } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useBoardLayout } from '@/context/BoardLayoutContext'
import type { BoardColumn, BoardTask } from '@/services/boards-api'
import { cn } from '@/lib/utils'

type Row = {
  task: BoardTask
  column: BoardColumn
}

export function BoardTaskList() {
  const { board, workspaceSlug, boardId } = useBoardLayout()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const search = useRouterState({ select: (s) => s.location.search as Record<string, unknown> })
  const view = (search.view as 'list' | 'kanban' | undefined) ?? 'list'

  const selectedTaskId = useMemo(() => {
    const m = /\/tasks\/(\d+)\/?$/.exec(pathname)
    return m?.[1]
  }, [pathname])

  const [q, setQ] = useState('')
  const rows = useMemo(() => {
    const cols = [...(board.board_columns ?? [])].sort((a, b) => {
      const pa = a.position ?? 0
      const pb = b.position ?? 0
      return pa - pb
    })
    const out: Row[] = []
    for (const col of cols) {
      const tasks = [...(col.tasks ?? [])].sort((a, b) =>
        (a.sort_key ?? '').localeCompare(b.sort_key ?? '', undefined, { sensitivity: 'base' }),
      )
      for (const task of tasks) {
        out.push({ task, column: col })
      }
    }
    const t = q.trim().toLowerCase()
    if (!t) return out
    return out.filter(
      (r) =>
        (r.task.name ?? '').toLowerCase().includes(t) ||
        (r.task.body ?? '').toLowerCase().includes(t),
    )
  }, [board.board_columns, q])

  const total = useMemo(() => {
    return (board.board_columns ?? []).reduce((acc, c) => acc + (c.tasks?.length ?? 0), 0)
  }, [board.board_columns])

  return (
    <section
      className={cn(
        'flex min-h-0 w-full flex-col overflow-hidden border-border bg-surface-0 lg:w-[min(100%,440px)] lg:max-w-[440px] lg:shrink-0 lg:border-r',
      )}
      aria-label="Board tasks"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-border px-3 py-3 sm:px-4">
        <h2 className="text-sm font-semibold tracking-tight text-fg">Tasks</h2>
        <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted">
          {total}
        </span>
      </header>

      <div className="shrink-0 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            className="w-full rounded-md border border-border bg-surface-1 py-2 pl-9 pr-3 text-sm text-fg outline-none ring-nav-active/30 placeholder:text-muted/80 focus:ring-2"
            placeholder="Search tasks…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <ul className="divide-y divide-border">
          {rows.map(({ task, column }) => {
            const id = String(task.id)
            const active = id === selectedTaskId
            const chipStyle = column.color
              ? { backgroundColor: `${column.color}33`, borderColor: `${column.color}55` }
              : undefined
            return (
              <li key={id}>
                <Link
                  to="/workspaces/$workspaceSlug/boards/$boardId/tasks/$taskId"
                  params={{ workspaceSlug, boardId, taskId: id }}
                  search={{ view }}
                  className={cn(
                    'block px-3 py-3.5 text-left outline-none transition sm:py-3 active:bg-surface-2/80',
                    active ? 'bg-surface-2 ring-1 ring-inset ring-nav-active/35' : 'hover:bg-surface-1',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-nav-active/80"
                      style={
                        column.color
                          ? { backgroundColor: column.color }
                          : undefined
                      }
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">
                          {(task.name ?? '').trim() || 'Untitled task'}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium text-muted',
                            !column.color && 'border-border bg-surface-2',
                          )}
                          style={chipStyle ? { ...chipStyle, color: 'var(--color-fg)' } : undefined}
                        >
                          {(column.name ?? 'Column').trim()}
                        </span>
                      </div>
                      {task.due_at ? (
                        <p className="mt-1 text-[11px] text-muted">Due {task.due_at}</p>
                      ) : null}
                      {task.body ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                          {task.body.replace(/<[^>]+>/g, '')}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">
            {total === 0 ? 'No open tasks on this board.' : 'No tasks match your search.'}
          </p>
        ) : null}
      </div>
    </section>
  )
}

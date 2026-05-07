import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronDown, Filter, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useBoardLayout } from '@/context/BoardLayoutContext'
import type { BoardColumn, BoardTask } from '@/services/boards-api'
import { formatBoardDueAt } from '@/lib/board-ui'
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

  const sortedColumns = useMemo(() => {
    return [...(board.board_columns ?? [])].sort((a, b) => {
      const pa = a.position ?? 0
      const pb = b.position ?? 0
      return pa - pb
    })
  }, [board.board_columns])

  /** Hidden column ids; empty = show all columns */
  const [hiddenColumnIds, setHiddenColumnIds] = useState<number[]>([])
  const hiddenSet = useMemo(() => new Set(hiddenColumnIds), [hiddenColumnIds])

  const [q, setQ] = useState('')

  const boardTaskTotal = useMemo(() => {
    return (board.board_columns ?? []).reduce((acc, c) => acc + (c.tasks?.length ?? 0), 0)
  }, [board.board_columns])

  const rows = useMemo(() => {
    const out: Row[] = []
    for (const col of sortedColumns) {
      if (hiddenSet.has(col.id)) continue
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
  }, [sortedColumns, hiddenSet, q])

  const filterActive = hiddenColumnIds.length > 0
  const searchActive = q.trim().length > 0

  function toggleColumnVisibility(columnId: number) {
    setHiddenColumnIds((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId],
    )
  }

  function showAllColumns() {
    setHiddenColumnIds([])
  }

  return (
    <section
      className={cn(
        'flex min-h-0 w-full flex-1 flex-col overflow-hidden border-border bg-surface-0 lg:w-[min(31rem,calc(100vw-2rem))] lg:max-w-[480px] lg:shrink-0 lg:border-r',
      )}
      aria-label="Board tasks"
    >
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-3 py-3 sm:px-4">
        <h2 className="text-sm font-semibold tracking-tight text-fg">Tasks</h2>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition',
                  filterActive
                    ? 'border-nav-active/50 bg-nav-active/10 text-fg'
                    : 'border-border bg-surface-2 text-muted hover:bg-surface-3 hover:text-fg',
                )}
                aria-label="Filter by column"
              >
                <Filter className="size-3.5 shrink-0" aria-hidden />
                Columns
                <ChevronDown className="size-3.5 shrink-0 opacity-70" aria-hidden />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-[120] max-h-[min(70vh,20rem)] min-w-[12rem] overflow-y-auto rounded-lg border border-border bg-surface-1 p-1 shadow-lg"
                sideOffset={6}
                align="end"
              >
                <DropdownMenu.Item
                  className="cursor-pointer rounded-md px-3 py-2 text-sm text-fg outline-none data-[highlighted]:bg-surface-2"
                  onSelect={(e) => {
                    e.preventDefault()
                    showAllColumns()
                  }}
                >
                  All columns
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                {sortedColumns.map((col) => {
                  const visible = !hiddenSet.has(col.id)
                  return (
                    <DropdownMenu.CheckboxItem
                      key={col.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-fg outline-none data-[highlighted]:bg-surface-2"
                      checked={visible}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={() => toggleColumnVisibility(col.id)}
                    >
                      <span className="truncate">{(col.name ?? 'Column').trim()}</span>
                    </DropdownMenu.CheckboxItem>
                  )
                })}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <div className="flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-0.5 tabular-nums">
            <span className="text-xs font-semibold text-fg">{rows.length}</span>
            {(filterActive || searchActive) && boardTaskTotal !== rows.length ? (
              <span className="text-[10px] text-muted">/ {boardTaskTotal}</span>
            ) : null}
          </div>
        </div>
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
            const dueLine = formatBoardDueAt(task.due_at ?? null)
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
                      {dueLine ? (
                        <p className="mt-1 text-[11px] text-muted">Due {dueLine}</p>
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
            {boardTaskTotal === 0
              ? 'No open tasks on this board.'
              : 'No tasks match your filters.'}
          </p>
        ) : null}
      </div>
    </section>
  )
}

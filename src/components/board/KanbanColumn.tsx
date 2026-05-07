import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Link, useRouterState } from '@tanstack/react-router'
import { AlignLeft, CheckSquare, Clock, GripVertical, MoreVertical } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { KanbanDialogState } from '@/components/board/KanbanTaskDialogs'
import { useBoardLayout } from '@/context/BoardLayoutContext'
import type { BoardColumn, BoardTask } from '@/services/boards-api'
import { toggleTaskStopwatch } from '@/services/boards-api'
import { cn } from '@/lib/utils'

type KanbanColumnProps = {
  column: BoardColumn
  taskIds: string[]
  tasksById: Map<string, BoardTask>
  isFullBadgeDisplay: boolean
  onOpenDialog: (state: KanbanDialogState) => void
}

function isSectionTask(task: BoardTask): boolean {
  return (task.name ?? '').trimStart().startsWith('---')
}

function sectionTitle(task: BoardTask): string {
  return (task.name ?? '').replace(/^\s*---\s*/, '').trim() || '—'
}

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function checklistRatio(task: BoardTask): string | null {
  const lists = task.task_checklists ?? []
  if (lists.length === 0) return null
  const items = lists.flatMap((l) => l.task_check_items ?? [])
  if (items.length === 0) return null
  const done = items.filter((i) => i.is_complete).length
  return `${done}/${items.length}`
}

function avatarUrl(u: { name?: string | null; email?: string; avatar_url?: string | null }): string {
  if (u.avatar_url) return u.avatar_url
  const label = u.name?.trim() || u.email || '?'
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}`
}

type KanbanStopwatchChipFixedProps = {
  task: BoardTask
  boardId: string
  enabled: boolean
  onUpdated: () => void
}

function KanbanStopwatchChipFixed({ task, boardId, enabled, onUpdated }: KanbanStopwatchChipFixedProps) {
  const startedAt = task.stopwatch_started_at
  const baseElapsed = task.stopwatch_elapsed_seconds ?? 0
  /** Elapsed seconds since `stopwatch_started_at` (from interval; avoids Date.now in render). */
  const [runningExtra, setRunningExtra] = useState(0)

  useEffect(() => {
    if (!startedAt) return
    const startMs = new Date(startedAt).getTime()
    if (Number.isNaN(startMs)) return
    const tick = () => setRunningExtra(Math.max(0, (Date.now() - startMs) / 1000))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [startedAt])

  const liveSeconds = baseElapsed + (startedAt ? runningExtra : 0)

  if (!enabled && !startedAt && !(baseElapsed > 0)) return null

  const label =
    startedAt || baseElapsed > 0 ? (
      <span className="font-mono text-[10px] text-muted">{formatDuration(liveSeconds)}</span>
    ) : null

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!enabled) return
        void (async () => {
          try {
            await toggleTaskStopwatch(boardId, task.id)
            onUpdated()
          } catch {
            /* */
          }
        })()
      }}
      className={cn(
        'inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-muted hover:bg-surface-1',
        !enabled && 'pointer-events-none opacity-60',
      )}
      title={enabled ? 'Timer' : undefined}
      disabled={!enabled}
    >
      <Clock className="size-3 shrink-0" aria-hidden />
      {label}
    </button>
  )
}

export function KanbanColumn({
  column,
  taskIds,
  tasksById,
  isFullBadgeDisplay,
  onOpenDialog,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-drop-${column.id}`,
    data: { type: 'column', columnId: column.id },
  })

  const headerStyle = column.color
    ? { borderTopColor: column.color, backgroundColor: `${column.color}22` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full min-h-0 w-[min(18rem,calc(100vw-3rem))] shrink-0 flex-col rounded-xl border border-border bg-surface-1 shadow-sm',
        isOver && 'ring-2 ring-nav-active/40',
      )}
    >
      <div
        className="shrink-0 border-b border-border px-3 py-2.5"
        style={headerStyle}
      >
        <h3 className="truncate text-sm font-semibold text-fg">
          {(column.name ?? 'Column').trim()}
        </h3>
        <p className="text-[11px] text-muted">{taskIds.length} tasks</p>
      </div>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
        {taskIds.map((id) => {
          const task = tasksById.get(id)
          if (!task) return null
          if (isSectionTask(task)) {
            return (
              <KanbanSectionCard key={id} task={task} />
            )
          }
          return (
            <KanbanTaskCard
              key={id}
              task={task}
              isFullBadgeDisplay={isFullBadgeDisplay}
              onOpenDialog={onOpenDialog}
            />
          )
        })}
      </ul>
    </div>
  )
}

function KanbanSectionCard({ task }: { task: BoardTask }) {
  const { workspaceSlug, boardId } = useBoardLayout()
  const search = useRouterState({ select: (s) => s.location.search as Record<string, unknown> })
  const view = (search.view as 'list' | 'kanban' | undefined) ?? 'kanban'

  const { setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(task.id),
    disabled: true,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  }

  return (
    <li ref={setNodeRef} style={style} className="list-none">
      <Link
        to="/workspaces/$workspaceSlug/boards/$boardId/tasks/$taskId"
        params={{ workspaceSlug, boardId, taskId: String(task.id) }}
        search={{ view }}
        className="mt-1 block rounded-lg border border-border bg-surface-2 px-2 py-2 text-center text-xs font-medium text-muted transition hover:border-nav-active/35 hover:bg-surface-3"
      >
        {sectionTitle(task)}
      </Link>
    </li>
  )
}

function KanbanTaskCard({
  task,
  isFullBadgeDisplay,
  onOpenDialog,
}: {
  task: BoardTask
  isFullBadgeDisplay: boolean
  onOpenDialog: (state: KanbanDialogState) => void
}) {
  const {
    workspaceSlug,
    boardId,
    board,
    refreshBoard,
  } = useBoardLayout()
  const search = useRouterState({ select: (s) => s.location.search as Record<string, unknown> })
  const view = (search.view as 'list' | 'kanban' | undefined) ?? 'kanban'
  const timeEnabled = board.time_tracking_enabled !== false

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(task.id),
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  }

  const tags = task.tags ?? []
  const users = task.task_users ?? []
  const ratio = checklistRatio(task)

  return (
    <li ref={setNodeRef} style={style} {...attributes} className="group relative list-none">
      <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-2 shadow-sm transition hover:border-nav-active/35 hover:bg-surface-3">
        <button
          type="button"
          className="mt-0.5 flex shrink-0 cursor-grab touch-none rounded p-0.5 text-muted hover:bg-surface-1 hover:text-fg active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
        <div className="min-w-0 flex-1 py-1">
          {tags.length > 0 ? (
            <div className={cn('mb-1.5 flex flex-wrap gap-1', !isFullBadgeDisplay && 'max-h-5 overflow-hidden')}>
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className={cn(
                    'inline-flex max-w-full truncate rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                  )}
                  style={
                    tag.color
                      ? {
                          borderColor: `${tag.color}99`,
                          backgroundColor: `${tag.color}33`,
                          color: 'var(--color-fg)',
                        }
                      : { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-3)' }
                  }
                >
                  {isFullBadgeDisplay ? tag.name : tag.name.slice(0, 1).toUpperCase()}
                </span>
              ))}
            </div>
          ) : null}
          <Link
            to="/workspaces/$workspaceSlug/boards/$boardId/tasks/$taskId"
            params={{ workspaceSlug, boardId, taskId: String(task.id) }}
            search={{ view }}
            className="block min-w-0 outline-none"
          >
            <p className="text-sm font-medium leading-snug text-fg">
              {(task.name ?? '').trim() || 'Untitled'}
            </p>
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {task.due_at ? (
              <p className="text-[10px] text-muted">Due {task.due_at}</p>
            ) : null}
            <KanbanStopwatchChipFixed
              task={task}
              boardId={boardId}
              enabled={timeEnabled}
              onUpdated={() => void refreshBoard()}
            />
            {task.body?.trim() ? (
              <span className="inline-flex text-muted" title="Has description">
                <AlignLeft className="size-3.5" aria-hidden />
              </span>
            ) : null}
            {ratio ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted" title="Checklist progress">
                <CheckSquare className="size-3.5" aria-hidden />
                {ratio}
              </span>
            ) : null}
          </div>
          {users.length > 0 ? (
            <div className="mt-2 flex justify-end -space-x-2">
              {users.slice(0, 4).map((u) => {
                const id = u.id ?? 0
                return (
                  <img
                    key={id || u.email}
                    src={avatarUrl(u)}
                    alt=""
                    className="size-6 rounded-full border-2 border-surface-2 bg-surface-3 object-cover"
                  />
                )
              })}
              {users.length > 4 ? (
                <span className="flex size-6 items-center justify-center rounded-full border-2 border-surface-2 bg-surface-3 text-[9px] font-medium text-muted">
                  +{users.length - 4}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="absolute right-1 top-1 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="flex size-7 items-center justify-center rounded-md text-muted hover:bg-surface-1 hover:text-fg"
              aria-label="Task actions"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MoreVertical className="size-4" aria-hidden />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-[120] min-w-[11rem] rounded-lg border border-border bg-surface-1 p-1 shadow-lg"
              sideOffset={4}
              align="end"
            >
              <DropdownMenu.Item
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-fg outline-none data-[highlighted]:bg-surface-2"
                onSelect={() => onOpenDialog({ kind: 'members', task })}
              >
                Change members
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-fg outline-none data-[highlighted]:bg-surface-2"
                onSelect={() => onOpenDialog({ kind: 'tags', task })}
              >
                Change tags
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-fg outline-none data-[highlighted]:bg-surface-2"
                onSelect={() => onOpenDialog({ kind: 'due', task })}
              >
                Change due date
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-fg outline-none data-[highlighted]:bg-surface-2"
                onSelect={() => onOpenDialog({ kind: 'move', task })}
              >
                Move card
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                className="cursor-pointer rounded-md px-3 py-2 text-sm text-red-400 outline-none data-[highlighted]:bg-surface-2"
                onSelect={() => onOpenDialog({ kind: 'delete', task })}
              >
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </li>
  )
}

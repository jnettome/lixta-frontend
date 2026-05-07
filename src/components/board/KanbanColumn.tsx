import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Link, useRouterState } from '@tanstack/react-router'
import { GripVertical } from 'lucide-react'

import { useBoardLayout } from '@/context/BoardLayoutContext'
import type { BoardColumn, BoardTask } from '@/services/boards-api'
import { cn } from '@/lib/utils'

type KanbanColumnProps = {
  column: BoardColumn
  taskIds: string[]
  tasksById: Map<string, BoardTask>
}

export function KanbanColumn({ column, taskIds, tasksById }: KanbanColumnProps) {
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
          return <KanbanCard key={id} task={task} />
        })}
      </ul>
    </div>
  )
}

function KanbanCard({ task }: { task: BoardTask }) {
  const { workspaceSlug, boardId } = useBoardLayout()
  const search = useRouterState({ select: (s) => s.location.search as Record<string, unknown> })
  const view = (search.view as 'list' | 'kanban' | undefined) ?? 'kanban'

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(task.id),
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  }

  return (
    <li ref={setNodeRef} style={style} {...attributes} className="list-none">
      <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-2 shadow-sm transition hover:border-nav-active/35 hover:bg-surface-3">
        <button
          type="button"
          className="mt-0.5 flex shrink-0 cursor-grab touch-none rounded p-0.5 text-muted hover:bg-surface-1 hover:text-fg active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
        <Link
          to="/workspaces/$workspaceSlug/boards/$boardId/tasks/$taskId"
          params={{ workspaceSlug, boardId, taskId: String(task.id) }}
          search={{ view }}
          className="min-w-0 flex-1 py-1 outline-none"
        >
          <p className="text-sm font-medium leading-snug text-fg">
            {(task.name ?? '').trim() || 'Untitled'}
          </p>
          {task.due_at ? <p className="mt-1 text-[11px] text-muted">Due {task.due_at}</p> : null}
        </Link>
      </div>
    </li>
  )
}

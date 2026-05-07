import { createFileRoute } from '@tanstack/react-router'

import { useBoardLayout } from '@/context/BoardLayoutContext'

export const Route = createFileRoute('/_authenticated/workspaces/$workspaceSlug/boards/$boardId/tasks/$taskId')({
  component: BoardTaskDetailRoute,
})

function BoardTaskDetailRoute() {
  const { taskId } = Route.useParams()
  const { board } = useBoardLayout()

  const task = board.board_columns
    ?.flatMap((c) => c.tasks ?? [])
    .find((t) => String(t.id) === taskId)

  const column = board.board_columns?.find((c) =>
    (c.tasks ?? []).some((t) => String(t.id) === taskId),
  )

  if (!task) {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center p-8 text-center">
        <p className="text-sm text-muted">Task not found on this board.</p>
      </div>
    )
  }

  const plainBody =
    typeof task.body === 'string' ? task.body.replace(/<[^>]+>/g, '').trim() : ''

  return (
    <article className="flex min-h-0 flex-col overflow-y-auto p-4 sm:p-6">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {column?.name?.trim() ?? 'Task'}
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-fg">
        {(task.name ?? '').trim() || 'Untitled task'}
      </h2>
      {task.due_at ? (
        <p className="mt-3 text-sm text-muted">Due {task.due_at}</p>
      ) : (
        <p className="mt-3 text-sm text-muted">No due date</p>
      )}
      {plainBody ? (
        <div className="mt-6 max-w-prose">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{plainBody}</p>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">No description.</p>
      )}
    </article>
  )
}

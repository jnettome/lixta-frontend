import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/workspaces/$workspaceSlug/boards/$boardId/')({
  component: BoardIndexRoute,
})

/** Placeholder when no task is selected in list view (full-width panel on desktop). */
function BoardIndexRoute() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface-1/95 p-10 text-center sm:p-12">
      <p className="max-w-sm text-sm text-muted">
        Select a task from the list, or switch to Kanban to see columns.
      </p>
    </div>
  )
}

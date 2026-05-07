import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/workspaces/$workspaceSlug/boards/$boardId/')({
  component: BoardIndexRoute,
})

function BoardIndexRoute() {
  return null
}

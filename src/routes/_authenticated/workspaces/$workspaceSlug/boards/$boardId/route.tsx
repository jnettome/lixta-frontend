import { Outlet, createFileRoute, useRouter, useRouterState } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'

import { BoardChromeHeader } from '@/components/board/BoardChromeHeader'
import { BoardKanban } from '@/components/board/BoardKanban'
import { BoardTaskList } from '@/components/board/BoardTaskList'
import { BoardTaskOverlay } from '@/components/board/BoardTaskOverlay'
import { BoardLayoutProvider } from '@/context/BoardLayoutContext'
import { BoardTaskPanelProvider } from '@/context/BoardTaskPanelContext'
import { useWorkspaceLayout } from '@/context/WorkspaceLayoutContext'
import type { BoardDetail } from '@/services/boards-api'
import { getBoard, getBoardMembers, getBoardTags } from '@/services/boards-api'

const boardSearchSchema = z.object({
  view: z.enum(['list', 'kanban']).optional(),
})

export type BoardSearch = z.infer<typeof boardSearchSchema>

function parseBoardSearch(raw: unknown): BoardSearch {
  const r = boardSearchSchema.safeParse(raw)
  return r.success ? r.data : {}
}

export const Route = createFileRoute('/_authenticated/workspaces/$workspaceSlug/boards/$boardId')({
  validateSearch: (raw): BoardSearch => parseBoardSearch(raw),
  loader: async ({ params }) => {
    const board = await getBoard(params.boardId)
    const [tagsResult, membersResult] = await Promise.allSettled([
      getBoardTags(params.boardId),
      getBoardMembers(params.boardId),
    ])
    return {
      board,
      boardTags: tagsResult.status === 'fulfilled' ? tagsResult.value : [],
      boardMembers: membersResult.status === 'fulfilled' ? membersResult.value : [],
    }
  },
  component: BoardLayoutRoute,
})

function BoardLayoutRoute() {
  const { workspaceSlug } = useWorkspaceLayout()
  const { boardId } = Route.useParams()
  const search = Route.useSearch()
  const view = search.view ?? 'list'
  const router = useRouter()
  const data = Route.useLoaderData()
  const [board, setBoard] = useState<BoardDetail>(data.board)

  useEffect(() => {
    const id = requestAnimationFrame(() => setBoard(data.board))
    return () => cancelAnimationFrame(id)
  }, [data.board])

  const refreshBoard = useCallback(async () => {
    await router.invalidate()
  }, [router])

  const ctxValue = {
    workspaceSlug,
    boardId,
    board,
    boardTags: data.boardTags,
    boardMembers: data.boardMembers,
    setBoard,
    refreshBoard,
  }

  const title = board.name?.trim() || 'Board'
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const taskId = useMemo(() => {
    const m = /\/tasks\/(\d+)\/?$/.exec(pathname)
    return m?.[1]
  }, [pathname])

  return (
    <BoardLayoutProvider value={ctxValue}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface-0">
        <BoardChromeHeader
          boardTitle={title}
          boardId={boardId}
          view={view}
          onRefresh={refreshBoard}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface-1">
          {view === 'list' ? (
            <BoardTaskList />
          ) : (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <BoardKanban />
            </div>
          )}
        </div>

        {taskId ? (
          <BoardTaskPanelProvider key={taskId}>
            <BoardTaskOverlay workspaceSlug={workspaceSlug} boardId={boardId} view={view} />
          </BoardTaskPanelProvider>
        ) : (
          <div className="sr-only" aria-hidden>
            <Outlet />
          </div>
        )}
      </div>
    </BoardLayoutProvider>
  )
}

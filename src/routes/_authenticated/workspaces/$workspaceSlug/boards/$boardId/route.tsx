import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Outlet, createFileRoute, useRouter, useRouterState } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'

import { BoardChromeHeader } from '@/components/board/BoardChromeHeader'
import { BoardKanban } from '@/components/board/BoardKanban'
import { BoardTaskList } from '@/components/board/BoardTaskList'
import { BoardLayoutProvider } from '@/context/BoardLayoutContext'
import { useWorkspaceLayout } from '@/context/WorkspaceLayoutContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { BoardDetail } from '@/services/boards-api'
import { getBoard } from '@/services/boards-api'
import { cn } from '@/lib/utils'

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
    return { board }
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
    setBoard,
    refreshBoard,
  }

  const title = board.name?.trim() || 'Board'
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isLg = useMediaQuery('(min-width: 1024px)')
  const reduceMotion = useReducedMotion() ?? false
  const duration = reduceMotion ? 0 : 0.38
  const slideX = reduceMotion ? 0 : 22
  const slideY = reduceMotion ? 0 : 14

  const taskDetailKey = useMemo(() => {
    const m = /\/tasks\/(\d+)\/?$/.exec(pathname)
    return m?.[1] ?? 'board-index'
  }, [pathname])

  return (
    <BoardLayoutProvider value={ctxValue}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface-0">
        <BoardChromeHeader boardTitle={title} onRefresh={refreshBoard} />

        {view === 'kanban' ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-surface-1">
            <BoardKanban />
          </div>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
            <BoardTaskList />
            <div
              className={cn(
                'relative min-h-0 min-w-0 flex-1 overflow-x-hidden bg-surface-1',
                'max-lg:min-h-[40vh]',
              )}
            >
              <AnimatePresence mode="sync">
                <motion.div
                  key={taskDetailKey}
                  className="absolute inset-0 flex min-h-0 min-w-0 flex-col overflow-y-auto"
                  initial={{
                    opacity: 0,
                    x: isLg ? slideX : 0,
                    y: isLg ? 0 : slideY,
                  }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{
                    opacity: 0,
                    x: isLg ? slideX * 0.5 : 0,
                    y: isLg ? 0 : slideY * 0.5,
                  }}
                  transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </BoardLayoutProvider>
  )
}

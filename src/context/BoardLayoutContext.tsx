import { createContext, useContext, type Dispatch, type ReactNode, type SetStateAction } from 'react'

import type { BoardDetail, BoardMember, BoardTag } from '@/services/boards-api'

export type BoardLayoutOutletContextValue = {
  workspaceSlug: string
  boardId: string
  board: BoardDetail
  boardTags: BoardTag[]
  boardMembers: BoardMember[]
  setBoard: Dispatch<SetStateAction<BoardDetail>>
  refreshBoard: () => Promise<void>
}

const BoardLayoutContext = createContext<BoardLayoutOutletContextValue | null>(null)

export function BoardLayoutProvider({
  value,
  children,
}: {
  value: BoardLayoutOutletContextValue
  children: ReactNode
}) {
  return <BoardLayoutContext.Provider value={value}>{children}</BoardLayoutContext.Provider>
}

export function useBoardLayout(): BoardLayoutOutletContextValue {
  const ctx = useContext(BoardLayoutContext)
  if (!ctx) throw new Error('useBoardLayout must be used within BoardLayoutProvider')
  return ctx
}

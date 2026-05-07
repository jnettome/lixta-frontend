import { createContext, useContext, useState, type ReactNode } from 'react'

export type BoardTaskPanelViewMode = 'split' | 'full'

type BoardTaskPanelContextValue = {
  panelView: BoardTaskPanelViewMode
  setPanelView: (v: BoardTaskPanelViewMode) => void
}

const BoardTaskPanelContext = createContext<BoardTaskPanelContextValue | null>(null)

export function BoardTaskPanelProvider({ children }: { children: ReactNode }) {
  const [panelView, setPanelView] = useState<BoardTaskPanelViewMode>('split')

  return (
    <BoardTaskPanelContext.Provider value={{ panelView, setPanelView }}>
      {children}
    </BoardTaskPanelContext.Provider>
  )
}

export function useBoardTaskPanel(): BoardTaskPanelContextValue {
  const ctx = useContext(BoardTaskPanelContext)
  if (!ctx) throw new Error('useBoardTaskPanel must be used within BoardTaskPanelProvider')
  return ctx
}

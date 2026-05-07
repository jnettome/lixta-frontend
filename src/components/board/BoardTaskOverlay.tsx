import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Outlet, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect } from 'react'

import { useBoardTaskPanel } from '@/context/BoardTaskPanelContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

type BoardTaskOverlayProps = {
  workspaceSlug: string
  boardId: string
  view: 'list' | 'kanban'
}

export function BoardTaskOverlay({ workspaceSlug, boardId, view }: BoardTaskOverlayProps) {
  const navigate = useNavigate()
  const { panelView } = useBoardTaskPanel()
  const isLg = useMediaQuery('(min-width: 1024px)')
  const reduceMotion = useReducedMotion() ?? false
  const duration = reduceMotion ? 0 : 0.32

  const mobileFullBleed = !isLg
  const desktopSplit = isLg && panelView === 'split'

  const close = useCallback(() => {
    void navigate({
      to: '/workspaces/$workspaceSlug/boards/$boardId',
      params: { workspaceSlug, boardId },
      search: { view },
    })
  }, [navigate, workspaceSlug, boardId, view])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  return (
    <AnimatePresence>
      <motion.div
        key="board-task-backdrop"
        role="presentation"
        className="fixed inset-0 z-40 bg-black/50 pt-[env(safe-area-inset-top)]"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}
        onClick={close}
      />
      <motion.div
        key="board-task-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
        className={cn(
          'fixed right-0 top-0 z-50 flex h-[100dvh] max-h-[100dvh] flex-col border-l border-border bg-surface-1 shadow-2xl',
          'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
          mobileFullBleed && 'w-full max-w-none',
          !mobileFullBleed && desktopSplit && 'w-full max-w-xl',
          !mobileFullBleed && !desktopSplit && 'w-full max-w-none',
        )}
        initial={{ x: reduceMotion ? 0 : '100%' }}
        animate={{ x: 0 }}
        exit={{ x: reduceMotion ? 0 : '100%' }}
        transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  )
}

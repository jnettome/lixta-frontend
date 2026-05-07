import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Outlet } from '@tanstack/react-router'
import { InboxChromeProvider } from '@/context/InboxChromeContext'
import { InboxList } from '@/components/shell/InboxList'
import { Sidebar } from '@/components/shell/Sidebar'
import { cn } from '@/lib/utils'

type InboxShellProps = {
  signalId?: string
  view: 'split' | 'full'
  onViewChange: (view: 'split' | 'full') => void
}

export function InboxShell({ signalId, view, onViewChange }: InboxShellProps) {
  const reduceMotion = useReducedMotion() ?? false
  const duration = reduceMotion ? 0 : 0.38
  const slide = reduceMotion ? 0 : 22

  const listHidden = view === 'full'

  return (
    <InboxChromeProvider value={{ view, onViewChange }}>
      <div className="flex h-full min-h-0 bg-surface-0">
        <Sidebar inboxActive />
        <motion.div
          className="grid min-h-0 min-w-0 flex-1"
          initial={false}
          animate={{
            gridTemplateColumns: listHidden ? '0px minmax(0,1fr)' : 'minmax(0,440px) minmax(0,1fr)',
          }}
          transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'grid' }}
        >
          <motion.div
            className="min-h-0 min-w-0 overflow-hidden border-r border-border"
            initial={false}
            animate={{ opacity: listHidden ? 0 : 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.28 }}
          >
            <InboxList selectedId={signalId} collapsed={listHidden} view={view} />
          </motion.div>

          <div className="relative min-h-0 min-w-0 bg-surface-1">
            {!signalId ? (
              <>
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface-1/95 p-10 text-center">
                  <p className="max-w-xs text-sm text-muted">
                    Select a signal from the list to open the detail panel.
                  </p>
                </div>
                <div className="sr-only">
                  <Outlet />
                </div>
              </>
            ) : (
              <AnimatePresence mode="sync">
                <motion.div
                  key={signalId}
                  className={cn('absolute inset-0 flex min-h-0 flex-col')}
                  initial={{ opacity: 0, x: slide }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: slide * 0.5 }}
                  transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </InboxChromeProvider>
  )
}

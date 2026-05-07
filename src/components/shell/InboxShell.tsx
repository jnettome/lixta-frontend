import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Outlet } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { InboxChromeProvider } from '@/context/InboxChromeContext'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { getSignal } from '@/lib/signals'
import { InboxList } from '@/components/shell/InboxList'
import { MobileHeader } from '@/components/shell/MobileHeader'
import { MobileNavDrawer } from '@/components/shell/MobileNavDrawer'
import { Sidebar, SidebarNav } from '@/components/shell/Sidebar'
import { cn } from '@/lib/utils'

type InboxShellProps = {
  signalId?: string
  view: 'split' | 'full'
  onViewChange: (view: 'split' | 'full') => void
}

export function InboxShell({ signalId, view, onViewChange }: InboxShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const isLg = useMediaQuery('(min-width: 1024px)')
  const reduceMotion = useReducedMotion() ?? false
  const duration = reduceMotion ? 0 : 0.38
  const slideX = reduceMotion ? 0 : 22
  const slideY = reduceMotion ? 0 : 14

  const listHiddenDesktop = view === 'full'
  const detailTitle = signalId ? getSignal(signalId)?.title : undefined

  useEffect(() => {
    if (!isLg) return
    const id = requestAnimationFrame(() => setMobileNavOpen(false))
    return () => cancelAnimationFrame(id)
  }, [isLg])

  return (
    <InboxChromeProvider value={{ view, onViewChange }}>
      <div className="flex h-full min-h-0 min-w-0 flex-col overflow-x-hidden bg-surface-0 lg:flex-row">
        <MobileHeader
          signalId={signalId}
          detailTitle={detailTitle}
          view={view}
          onOpenNav={() => setMobileNavOpen(true)}
        />

        <MobileNavDrawer open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SidebarNav
            dashboardActive={false}
            signalsActive
            variant="drawer"
            onNavigate={() => setMobileNavOpen(false)}
          />
        </MobileNavDrawer>

        <Sidebar dashboardActive={false} signalsActive />

        <div
          className={cn(
            'flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row',
            'pb-[env(safe-area-inset-bottom)] lg:pb-0',
          )}
        >
          <motion.div
            className={cn(
              'flex min-h-0 flex-col overflow-hidden border-border max-lg:border-r-0 lg:border-r',
              signalId ? 'hidden lg:flex' : 'flex min-h-0 flex-1 lg:min-h-0',
              listHiddenDesktop &&
                'lg:pointer-events-none lg:border-transparent lg:overflow-hidden',
            )}
            initial={false}
            animate={
              isLg
                ? {
                    flexBasis: listHiddenDesktop ? 0 : 440,
                    opacity: listHiddenDesktop ? 0 : 1,
                  }
                : {}
            }
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
            style={isLg ? { flexGrow: 0, flexShrink: 0 } : undefined}
          >
            <InboxList
              selectedId={signalId}
              collapsed={isLg && listHiddenDesktop}
              view={view}
            />
          </motion.div>

          <div
            className={cn(
              'relative min-h-0 min-w-0 overflow-x-hidden bg-surface-1',
              !signalId
                ? 'hidden lg:block lg:min-h-0 lg:flex-1'
                : 'flex min-h-0 flex-1 flex-col lg:min-h-0 lg:flex-1',
            )}
          >
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
                  className="absolute inset-0 flex min-h-0 min-w-0 flex-col overflow-x-hidden"
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
            )}
          </div>
        </div>
      </div>
    </InboxChromeProvider>
  )
}

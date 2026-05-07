import { createContext, useContext, type ReactNode } from 'react'

export type InboxViewMode = 'split' | 'full'

type InboxChromeContextValue = {
  view: InboxViewMode
  onViewChange: (view: InboxViewMode) => void
}

const InboxChromeContext = createContext<InboxChromeContextValue | null>(null)

export function InboxChromeProvider({
  value,
  children,
}: {
  value: InboxChromeContextValue
  children: ReactNode
}) {
  return <InboxChromeContext.Provider value={value}>{children}</InboxChromeContext.Provider>
}

export function useInboxChrome(): InboxChromeContextValue {
  const ctx = useContext(InboxChromeContext)
  if (!ctx) throw new Error('useInboxChrome must be used within InboxChromeProvider')
  return ctx
}

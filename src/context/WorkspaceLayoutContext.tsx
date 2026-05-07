import { createContext, useContext, type ReactNode } from 'react'

import type { WorkspaceDetail } from '@/services/workspaces-api'
import type { WorkspaceMember } from '@/services/workspace-users-api'

export type WorkspaceOutletContextValue = {
  workspaceSlug: string
  workspace: WorkspaceDetail
  members: WorkspaceMember[]
  refreshWorkspace: () => Promise<void>
  openWorkspaceMobileNav: () => void
}

const WorkspaceLayoutContext = createContext<WorkspaceOutletContextValue | null>(null)

export function WorkspaceLayoutProvider({
  value,
  children,
}: {
  value: WorkspaceOutletContextValue
  children: ReactNode
}) {
  return <WorkspaceLayoutContext.Provider value={value}>{children}</WorkspaceLayoutContext.Provider>
}

/** Shared workspace chrome + outlet children; provider lives on the `$workspaceSlug` layout route only. */
export function useWorkspaceLayout(): WorkspaceOutletContextValue {
  const ctx = useContext(WorkspaceLayoutContext)
  if (!ctx)
    throw new Error('useWorkspaceLayout must be used under WorkspaceLayoutProvider (workspace layout route)')
  return ctx
}

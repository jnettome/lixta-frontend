import { Link } from '@tanstack/react-router'
import { Menu, RefreshCw } from 'lucide-react'

import { useWorkspaceLayout } from '@/context/WorkspaceLayoutContext'
import { cn } from '@/lib/utils'

type BoardChromeHeaderProps = {
  boardTitle: string
  onRefresh: () => void | Promise<void>
}

export function BoardChromeHeader({ boardTitle, onRefresh }: BoardChromeHeaderProps) {
  const { workspaceSlug, openWorkspaceMobileNav } = useWorkspaceLayout()

  return (
    <header
      className={cn(
        'flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-surface-0',
        'px-3 py-3 sm:px-4',
        'pt-[max(0.5rem,env(safe-area-inset-top))] lg:pt-3',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-fg transition hover:bg-surface-2 lg:hidden"
          aria-label="Open menu"
          onClick={openWorkspaceMobileNav}
        >
          <Menu className="size-5" strokeWidth={2} />
        </button>
        <Link
          to="/workspaces/$workspaceSlug"
          params={{ workspaceSlug }}
          className="hidden rounded-lg px-2 py-1.5 text-xs font-medium text-muted transition hover:bg-surface-2 hover:text-fg lg:inline"
        >
          ← Workspace
        </Link>
        <Link
          to="/workspaces/$workspaceSlug"
          params={{ workspaceSlug }}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-fg transition hover:bg-surface-2 lg:hidden"
          aria-label="Back to workspace"
        >
          <span className="text-lg leading-none">←</span>
        </Link>
        <h1 className="min-w-0 truncate text-sm font-semibold tracking-tight text-fg sm:text-base">
          {boardTitle}
        </h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
        <button
          type="button"
          onClick={() => void onRefresh()}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-1 text-muted transition hover:bg-surface-2 hover:text-fg"
          aria-label="Refresh board"
        >
          <RefreshCw className="size-4" aria-hidden />
        </button>
      </div>
    </header>
  )
}

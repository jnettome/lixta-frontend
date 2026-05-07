import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

type WorkspaceMobileHeaderProps = {
  workspaceName: string
  workspaceSlug: string
  subtitle?: string
  onOpenNav: () => void
  className?: string
}

export function WorkspaceMobileHeader({
  workspaceName,
  workspaceSlug,
  subtitle,
  onOpenNav,
  className,
}: WorkspaceMobileHeaderProps) {
  return (
    <header
      className={cn(
        'flex shrink-0 items-center gap-2 border-b border-border bg-surface-0 px-3 py-2.5 lg:hidden',
        'pt-[max(0.625rem,env(safe-area-inset-top))]',
        className,
      )}
    >
      <button
        type="button"
        onClick={onOpenNav}
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-fg transition hover:bg-surface-2 active:bg-surface-2"
        aria-label="Open menu"
      >
        <Menu className="size-5" strokeWidth={2} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold tracking-tight text-fg">{workspaceName}</h1>
        <p className="truncate text-[11px] text-muted">
          {subtitle ?? (
            <>
              <Link to="/dashboard" className="font-medium text-nav-active hover:underline">
                Dashboard
              </Link>
              <span aria-hidden> · </span>
              <Link
                to="/workspaces/$workspaceSlug"
                params={{ workspaceSlug }}
                className="hover:text-fg"
              >
                {workspaceSlug}
              </Link>
            </>
          )}
        </p>
      </div>
    </header>
  )
}

import { Link } from '@tanstack/react-router'
import { ChevronLeft, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

type MobileHeaderProps = {
  signalId?: string
  detailTitle?: string
  view: 'split' | 'full'
  onOpenNav: () => void
  className?: string
}

export function MobileHeader({
  signalId,
  detailTitle,
  view,
  onOpenNav,
  className,
}: MobileHeaderProps) {
  return (
    <header
      className={cn(
        'flex shrink-0 items-center gap-2 border-b border-border bg-surface-0 px-3 py-2.5 lg:hidden',
        'pt-[max(0.625rem,env(safe-area-inset-top))]',
        className,
      )}
    >
      {signalId ? (
        <Link
          to="/signals"
          search={{ view }}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-fg transition hover:bg-surface-2 active:bg-surface-2"
          aria-label="Back to signals"
        >
          <ChevronLeft className="size-5" strokeWidth={2} />
        </Link>
      ) : (
        <button
          type="button"
          onClick={onOpenNav}
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-fg transition hover:bg-surface-2 active:bg-surface-2"
          aria-label="Open menu"
        >
          <Menu className="size-5" strokeWidth={2} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold tracking-tight text-fg">
          {signalId ? detailTitle ?? 'Signal' : 'Inbox'}
        </h1>
        {!signalId ? (
          <p className="truncate text-[11px] text-muted">Signals workspace</p>
        ) : null}
      </div>
    </header>
  )
}

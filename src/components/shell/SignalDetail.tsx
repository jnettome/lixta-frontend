import { Link, useNavigate } from '@tanstack/react-router'
import { ChevronDown, Maximize2, Minimize2, X } from 'lucide-react'
import { useState } from 'react'
import { useInboxChrome } from '@/context/InboxChromeContext'
import { getSignal } from '@/lib/signals'
import { cn } from '@/lib/utils'

type SignalDetailProps = {
  signalId: string
}

export function SignalDetail({ signalId }: SignalDetailProps) {
  const { view, onViewChange } = useInboxChrome()
  const navigate = useNavigate()
  const inboxSearch = { view }
  const signal = getSignal(signalId)
  const [expanded, setExpanded] = useState(false)

  if (!signal) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-sm text-muted">Signal not found.</p>
        <Link
          to="/signals"
          search={inboxSearch}
          className="text-sm font-medium text-nav-active hover:underline"
        >
          Back to signals
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-1">
      <header className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-start sm:px-5 sm:py-4">
        <div className="min-w-0 flex-1 lg:pr-2">
          <h2 className="text-[15px] font-semibold leading-snug tracking-tight text-fg sm:text-base">
            {signal.title}
          </h2>
        </div>
        <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-1 sm:justify-end">
          <button
            type="button"
            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-fg transition hover:bg-surface-3 sm:py-1.5"
          >
            Create task
          </button>
          <button
            type="button"
            disabled
            className="rounded-md border border-transparent px-3 py-2 text-xs font-medium text-muted opacity-60 sm:py-1.5"
          >
            Run cloud
          </button>
          <button
            type="button"
            className="hidden rounded-md p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg lg:inline-flex"
            aria-label={view === 'full' ? 'Exit full view' : 'Open full view'}
            onClick={() => onViewChange(view === 'full' ? 'split' : 'full')}
          >
            {view === 'full' ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </button>
          <button
            type="button"
            className="hidden rounded-md p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg lg:inline-flex"
            aria-label="Close detail"
            onClick={() => void navigate({ to: '/signals', search: { view: inboxSearch.view } })}
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
        <p className="text-sm text-muted">
          {signal.status === 'RUNNING'
            ? 'Research is still running on this signal. Check back shortly or create a task to track follow-up.'
            : 'Research is still running… Review tags and metrics below before promoting or assigning.'}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] text-muted">
            {signal.occurrences} occurrences
          </span>
          <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] text-muted">
            {signal.affectedUsers} affected users
          </span>
        </div>

        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Signals</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {signal.tags.map((t) => (
              <code
                key={t}
                className="rounded border border-border bg-surface-0 px-2 py-1 font-mono text-[11px] text-fg/90"
              >
                {t}
              </code>
            ))}
          </div>
        </div>

        <article className={cn('mt-6 text-sm leading-relaxed text-muted', !expanded && 'line-clamp-6')}>
          {signal.body.split('\n\n').map((para, i) => (
            <p key={i} className={i > 0 ? 'mt-3' : undefined}>
              {para}
            </p>
          ))}
        </article>

        <button
          type="button"
          className="mt-4 flex items-center gap-1 text-xs font-medium text-fg/90 hover:underline"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? 'Show less' : 'Show more'}
          <ChevronDown className={cn('size-3.5 transition', expanded && 'rotate-180')} />
        </button>
      </div>
    </div>
  )
}

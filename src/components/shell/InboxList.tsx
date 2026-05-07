import { Link } from '@tanstack/react-router'
import { Search, Settings } from 'lucide-react'
import { useMemo, useState } from 'react'
import { type Signal, type SignalStatus } from '@/data/mockSignals'
import { listSignals } from '@/lib/signals'
import { cn } from '@/lib/utils'

function statusDot(status: SignalStatus): string {
  switch (status) {
    case 'READY':
      return 'bg-accent-green'
    case 'QUEUED':
      return 'bg-accent-blue'
    case 'WARNING':
      return 'bg-accent-amber'
    default:
      return 'bg-muted'
  }
}

function statusBadge(status: SignalStatus): { label: string; className: string } {
  switch (status) {
    case 'READY':
      return {
        label: 'READY',
        className: 'border-accent-green-dim bg-accent-green-dim/40 text-accent-green',
      }
    case 'QUEUED':
      return {
        label: 'QUEUED',
        className: 'border-accent-blue-dim bg-accent-blue-dim/40 text-accent-blue',
      }
    case 'WARNING':
      return { label: 'ATTN', className: 'border-amber-900/60 bg-amber-950/50 text-accent-amber' }
    case 'RUNNING':
      return { label: 'RUNNING', className: 'border-border bg-surface-3 text-muted' }
  }
}

type InboxListProps = {
  selectedId?: string
  collapsed?: boolean
  view: 'split' | 'full'
}

export function InboxList({ selectedId, collapsed, view }: InboxListProps) {
  const linkSearch = { view }
  const [q, setQ] = useState('')
  const items = useMemo(() => {
    const all = listSignals()
    const t = q.trim().toLowerCase()
    if (!t) return all
    return all.filter(
      (s: Signal) =>
        s.title.toLowerCase().includes(t) ||
        s.snippet.toLowerCase().includes(t) ||
        s.tags.some((tag: string) => tag.toLowerCase().includes(t)),
    )
  }, [q])

  const allSignals = listSignals()
  const ready = allSignals.filter((s: Signal) => s.status === 'READY').length
  const pipeline = allSignals.filter((s: Signal) => s.status !== 'READY').length

  return (
    <section
      className={cn(
        'flex min-h-0 min-w-0 flex-col border-r border-border bg-surface-0',
        collapsed && 'pointer-events-none border-transparent',
      )}
      aria-hidden={collapsed}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <h1 className="text-sm font-semibold tracking-tight text-fg">Inbox</h1>
        <button
          type="button"
          className="rounded p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg"
          aria-label="Configure signals"
        >
          <Settings className="size-4" />
        </button>
      </header>

      <div className="shrink-0 border-b border-border px-4 py-3">
        <p className="text-xs text-muted">
          Signals <span className="font-semibold text-fg">({allSignals.length})</span>
        </p>
        <p className="mt-0.5 text-[11px] text-muted">
          <span className="text-accent-green">{ready} ready</span>
          <span className="text-muted"> · </span>
          <span>{pipeline} in pipeline</span>
        </p>
      </div>

      <div className="shrink-0 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            className="w-full rounded-md border border-border bg-surface-1 py-2 pl-9 pr-3 text-sm text-fg outline-none ring-nav-active/30 placeholder:text-muted/80 focus:ring-2"
            placeholder="Search signals..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ul className="divide-y divide-border">
          {items.map((s: Signal) => (
            <SignalRow
              key={s.id}
              signal={s}
              active={s.id === selectedId}
              listSearch={linkSearch}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}

function SignalRow({
  signal,
  active,
  listSearch,
}: {
  signal: Signal
  active: boolean
  listSearch: { view: 'split' | 'full' }
}) {
  const badge = statusBadge(signal.status)

  return (
    <li>
      <Link
        to="/inbox/$signalId"
        params={{ signalId: signal.id }}
        search={listSearch}
        className={cn(
          'block px-3 py-3 text-left outline-none transition',
          active ? 'bg-surface-2 ring-1 ring-inset ring-nav-active/35' : 'hover:bg-surface-1',
        )}
      >
        <div className="flex items-start gap-2">
          <span
            className={cn('mt-1.5 size-2 shrink-0 rounded-full', statusDot(signal.status))}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">
                {signal.title}
              </span>
              <span
                className={cn(
                  'shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  badge.className,
                )}
              >
                {badge.label}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
              <span>{signal.dateLabel}</span>
              <span className="font-mono text-muted/90">{signal.wave}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{signal.snippet}</p>
          </div>
        </div>
      </Link>
    </li>
  )
}

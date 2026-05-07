import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-surface-3/80', className)}
      aria-hidden
    />
  )
}

/** Placeholder grid while workspace list is fetching; mirrors real card layout. */
/** Activity column while workspace feed is loading. */
export function WorkspaceActivityColumnSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading activity">
      <Skeleton className="h-8 w-full rounded-lg" />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex gap-3 rounded-lg border border-border bg-surface-1 p-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4 max-w-[12rem]" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function WorkspaceListSkeleton() {
  return (
    <ul
      className="grid gap-4 sm:grid-cols-2"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading workspaces"
    >
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i}>
          <div className="flex h-full min-h-[140px] flex-col gap-3 rounded-xl border border-border bg-surface-1 p-5 shadow-sm">
            <Skeleton className="h-5 w-[min(55%,12rem)]" />
            <Skeleton className="h-3 w-28" />
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Skeleton className="h-5 w-14 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

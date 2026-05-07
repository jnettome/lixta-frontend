import type { ErrorComponentProps } from '@tanstack/react-router'

export function RootRouteError({ error, reset }: ErrorComponentProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-surface-0 p-8 text-center">
      <h1 className="text-lg font-semibold text-fg">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted">
        {error instanceof Error ? error.message : String(error)}
      </p>
      <button
        type="button"
        className="rounded-md border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-fg hover:bg-surface-3"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  )
}

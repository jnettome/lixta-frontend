import * as Dialog from '@radix-ui/react-dialog'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { LayoutDashboard, Plus, Radio, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/lib/utils'
import { createWorkspace, listWorkspaces, type Workspace } from '@/services/workspaces-api'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function greetingLabel(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function DashboardPage() {
  const navigate = useNavigate()
  const { session, refreshUser, signOut } = useAuth()
  const user = session?.user
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const reloadWorkspaces = useCallback(async () => {
    try {
      const list = await listWorkspaces()
      setWorkspaces(list)
      setLoadError(null)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load workspaces')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [, list] = await Promise.all([
          refreshUser().catch(() => {}),
          listWorkspaces(),
        ])
        if (!cancelled) {
          setWorkspaces(list)
          setLoadError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Could not load workspaces')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refreshUser])

  async function onCreateWorkspace(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setCreating(true)
    setFormError(null)
    try {
      await createWorkspace(name)
      setNewName('')
      setDialogOpen(false)
      setToast(`Workspace “${name}” created`)
      window.setTimeout(() => setToast(null), 4000)
      await reloadWorkspaces()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create workspace')
    } finally {
      setCreating(false)
    }
  }

  const displayName = user?.name?.trim() || user?.email || 'there'

  return (
    <div
      className={cn(
        'min-h-full bg-surface-0',
        'px-4 py-8 sm:px-8',
        'pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]',
      )}
    >
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <header className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium text-nav-active">{greetingLabel()},</p>
            <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              {displayName}
            </h1>
            <p className="max-w-xl text-sm text-muted">
              Your workspaces and signals in one place. Open Signals for the feed or manage
              workspaces here.
            </p>
          </header>
          <nav className="flex shrink-0 items-center gap-3 text-sm">
            <Link
              to="/account"
              className="font-medium text-nav-active hover:underline"
            >
              Profile
            </Link>
            <button
              type="button"
              className="font-medium text-muted hover:text-fg"
              onClick={() => void signOut().then(() => navigate({ to: '/login' }))}
            >
              Sign out
            </button>
          </nav>
        </div>

        {toast ? (
          <p
            className="rounded-lg border border-border bg-surface-1 px-4 py-3 text-sm text-fg shadow-sm"
            role="status"
          >
            {toast}
          </p>
        ) : null}

        <section aria-label="Overview metrics">
          <h2 className="sr-only">Key metrics</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Open signals', value: '—', hint: 'Placeholder' },
              { label: 'Due this week', value: '—', hint: 'Placeholder' },
              { label: 'Team velocity', value: '—', hint: 'Placeholder' },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-border bg-surface-1 p-5 shadow-sm"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted">{kpi.label}</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-fg">{kpi.value}</p>
                <p className="mt-1 text-xs text-muted">{kpi.hint}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="workspaces-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="workspaces-heading" className="text-lg font-semibold text-fg">
                Workspaces
              </h2>
              <p className="text-sm text-muted">From your tarefas account</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/signals"
                search={{ view: 'split' }}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-4 py-2.5 text-sm font-medium text-fg shadow-sm transition hover:bg-surface-2"
              >
                <Radio className="size-4 opacity-80" aria-hidden />
                Open Signals
              </Link>
              <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
                <Dialog.Trigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg bg-nav-active px-4 py-2.5 text-sm font-medium text-nav-active-fg shadow-sm transition hover:opacity-90"
                  >
                    <Plus className="size-4" aria-hidden />
                    New workspace
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
                  <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(100vw-2rem,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-1 p-6 shadow-xl outline-none">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Dialog.Title className="text-lg font-semibold text-fg">
                          New workspace
                        </Dialog.Title>
                        <Dialog.Description className="text-sm text-muted">
                          Choose a name. You can manage boards in the main tarefas app.
                        </Dialog.Description>
                      </div>
                      <Dialog.Close
                        type="button"
                        className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg"
                        aria-label="Close"
                      >
                        <X className="size-5" />
                      </Dialog.Close>
                    </div>
                    <form className="mt-6 space-y-4" onSubmit={(e) => void onCreateWorkspace(e)}>
                      <label className="block text-xs font-medium text-muted">
                        Name
                        <input
                          className="mt-1.5 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none ring-nav-active/30 focus:ring-2"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="e.g. Product launch"
                          autoFocus
                          required
                        />
                      </label>
                      {formError ? <p className="text-xs text-red-500">{formError}</p> : null}
                      <div className="flex justify-end gap-2 pt-2">
                        <Dialog.Close asChild>
                          <button
                            type="button"
                            className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2"
                          >
                            Cancel
                          </button>
                        </Dialog.Close>
                        <button
                          type="submit"
                          disabled={creating}
                          className="rounded-lg bg-nav-active px-4 py-2 text-sm font-medium text-nav-active-fg disabled:opacity-50"
                        >
                          {creating ? 'Creating…' : 'Create'}
                        </button>
                      </div>
                    </form>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted">Loading workspaces…</p>
          ) : loadError ? (
            <p className="text-sm text-red-500">{loadError}</p>
          ) : workspaces.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface-1/50 px-6 py-12 text-center">
              <LayoutDashboard className="mx-auto size-10 text-muted opacity-50" aria-hidden />
              <p className="mt-3 text-sm font-medium text-fg">No workspaces yet</p>
              <p className="mt-1 text-sm text-muted">Create one to get started.</p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {workspaces.map((ws) => {
                const boards = (ws.boards ?? []).filter((b) => !b.archived)
                return (
                  <li key={ws.id}>
                    <article className="flex h-full flex-col rounded-xl border border-border bg-surface-1 p-5 shadow-sm transition hover:border-nav-active/30 hover:shadow-md">
                      <h3 className="font-semibold text-fg">{ws.name}</h3>
                      <p className="mt-0.5 font-mono text-xs text-muted">/{ws.slug}</p>
                      {ws.description ? (
                        <p className="mt-2 line-clamp-2 text-sm text-muted">{ws.description}</p>
                      ) : null}
                      {boards.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {boards.slice(0, 6).map((b) => (
                            <span
                              key={b.id}
                              className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted"
                            >
                              {b.name?.trim() || 'Board'}
                            </span>
                          ))}
                          {boards.length > 6 ? (
                            <span className="text-[11px] text-muted">+{boards.length - 6}</span>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-4 text-xs text-muted">No active boards</p>
                      )}
                    </article>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

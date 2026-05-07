import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ChevronDown, Filter, Layers, Users, X } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import type { WorkspaceActivity } from '@/services/workspace-activities-api'
import { listWorkspaceActivities } from '@/services/workspace-activities-api'
import { createBoard } from '@/services/boards-api'
import { updateWorkspace } from '@/services/workspaces-api'
import { WorkspaceActivityColumnSkeleton } from '@/components/ui/Skeleton'
import { useWorkspaceLayout } from '@/context/WorkspaceLayoutContext'
import { useCallback, useEffect, useMemo, useState } from 'react'

const ACTIVITY_TYPE_FILTERS = [
  { value: 'activity_type_comment', label: 'Comments' },
  { value: 'activity_type_attachment', label: 'Attachments' },
  { value: 'activity_type_task_created', label: 'Created' },
  { value: 'activity_type_task_moved', label: 'Moved' },
  { value: 'activity_type_task_archived', label: 'Archived' },
  { value: 'activity_type_checklist_item_completed', label: 'Checklist' },
  { value: 'activity_type_task_assigned', label: 'Assigned' },
  { value: 'activity_type_task_due_date_changed', label: 'Due date' },
  { value: 'activity_type_task_updated', label: 'Updated' },
] as const

export const Route = createFileRoute('/_authenticated/workspaces/$workspaceSlug/')({
  component: WorkspaceOverviewPage,
})

function WorkspaceOverviewPage() {
  const { session } = useAuth()
  const currentUserId = session?.user.id
  const navigate = useNavigate()
  const { workspaceSlug, workspace, members, refreshWorkspace } = useWorkspaceLayout()

  const isAdmin = useMemo(() => {
    if (currentUserId == null) return false
    return members.some((m) => m.user.id === currentUserId && m.role === 'role_admin')
  }, [currentUserId, members])

  const [displayArchived, setDisplayArchived] = useState(false)
  const [activityDays, setActivityDays] = useState(7)
  const [activityTypeFilter, setActivityTypeFilter] = useState<string[]>([])
  const [activities, setActivities] = useState<WorkspaceActivity[] | null>(null)
  const [activitiesLoading, setActivitiesLoading] = useState(true)

  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState(() => workspace.name)
  const [savingName, setSavingName] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [creatingBoard, setCreatingBoard] = useState(false)
  const [createBoardError, setCreateBoardError] = useState<string | null>(null)

  const activityTypesSorted = useMemo(
    () => [...activityTypeFilter].sort().join(','),
    [activityTypeFilter],
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await Promise.resolve()
      if (!cancelled) setActivitiesLoading(true)
      try {
        const list = await listWorkspaceActivities(workspaceSlug, {
          days: activityDays,
          activityTypes: activityTypeFilter.length > 0 ? activityTypeFilter : undefined,
        })
        if (!cancelled) {
          setActivities(list)
        }
      } catch {
        if (!cancelled) setActivities([])
      } finally {
        if (!cancelled) setActivitiesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [workspaceSlug, activityDays, activityTypesSorted, activityTypeFilter])

  const boards = useMemo(() => {
    const all = workspace.boards ?? []
    return displayArchived ? all : all.filter((b) => !b.archived)
  }, [workspace.boards, displayArchived])

  async function onSaveWorkspaceName(e: React.FormEvent) {
    e.preventDefault()
    const name = editName.trim()
    if (!name) return
    setSavingName(true)
    setEditError(null)
    try {
      await updateWorkspace(workspaceSlug, name)
      await refreshWorkspace()
      setEditOpen(false)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Could not update workspace')
    } finally {
      setSavingName(false)
    }
  }

  async function onCreateBoard(e: React.FormEvent) {
    e.preventDefault()
    const name = newBoardName.trim()
    if (!name) return
    setCreatingBoard(true)
    setCreateBoardError(null)
    try {
      const board = await createBoard({ name, workspaceId: workspaceSlug })
      setNewBoardName('')
      setCreateOpen(false)
      await refreshWorkspace()
      void navigate({
        to: '/workspaces/$workspaceSlug/boards/$boardId',
        params: {
          workspaceSlug,
          boardId: String(board.id),
        },
        search: { view: 'list' },
      })
    } catch (err) {
      setCreateBoardError(err instanceof Error ? err.message : 'Could not create board')
    } finally {
      setCreatingBoard(false)
    }
  }

  const toggleActivityType = useCallback((value: string) => {
    setActivityTypeFilter((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value],
    )
  }, [])

  const activityFilterAdjustments =
    (activityDays !== 7 ? 1 : 0) + (activityTypeFilter.length > 0 ? 1 : 0)

  const memberFaces = members.slice(0, 12)

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-surface-1 px-5 py-4 shadow-sm">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex -space-x-2 rtl:space-x-reverse">
              {memberFaces.map((m) =>
                m.user?.avatar_url ? (
                  <img
                    key={m.id}
                    src={m.user.avatar_url}
                    alt=""
                    className="inline-block size-8 rounded-full ring-2 ring-surface-1 object-cover"
                    title={m.user?.name ?? m.user?.email}
                  />
                ) : (
                  <span
                    key={m.id}
                    title={m.user?.name ?? m.user?.email}
                    className="inline-flex size-8 items-center justify-center rounded-full bg-surface-3 text-[10px] font-semibold uppercase ring-2 ring-surface-1 text-muted"
                  >
                    {(m.user?.name ?? m.user?.email ?? '?').slice(0, 2)}
                  </span>
                ),
              )}
            </div>
            <Link
              to="/workspaces/$workspaceSlug/users"
              params={{ workspaceSlug }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-nav-active hover:underline"
            >
              <Users className="size-3.5 opacity-90" aria-hidden />
              Members
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={displayArchived}
              className="size-4 rounded border-border accent-nav-active"
              onChange={(e) => setDisplayArchived(e.target.checked)}
            />
            Show archived
          </label>

          {isAdmin ? (
            <Dialog.Root
              open={editOpen}
              onOpenChange={(open) => {
                setEditOpen(open)
                if (open) setEditName(workspace.name)
              }}
            >
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-fg shadow-sm transition hover:bg-surface-3"
                >
                  Edit workspace
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(100vw-2rem,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-1 p-6 shadow-xl outline-none">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <Dialog.Title className="text-lg font-semibold text-fg">Edit workspace</Dialog.Title>
                      <Dialog.Description className="sr-only">Change the workspace display name.</Dialog.Description>
                      <span className="text-sm text-muted">Only admins can update the name.</span>
                    </div>
                    <Dialog.Close
                      type="button"
                      className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg"
                      aria-label="Close"
                    >
                      <X className="size-5" />
                    </Dialog.Close>
                  </div>
                  <form className="mt-5 space-y-4" onSubmit={(e) => void onSaveWorkspaceName(e)}>
                    <label className="block text-xs font-medium text-muted">
                      Name
                      <input
                        className="mt-1.5 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none ring-nav-active/30 focus:ring-2"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </label>
                    {editError ? <p className="text-xs text-red-500">{editError}</p> : null}
                    <div className="flex justify-end gap-2 pt-1">
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
                        disabled={savingName}
                        className="rounded-lg bg-nav-active px-4 py-2 text-sm font-medium text-nav-active-fg disabled:opacity-50"
                      >
                        {savingName ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </form>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          ) : null}

          <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                className="rounded-lg bg-nav-active px-3 py-2 text-xs font-semibold text-nav-active-fg shadow-sm transition hover:opacity-90"
              >
                Create board
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(100vw-2rem,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-1 p-6 shadow-xl outline-none">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Dialog.Title className="text-lg font-semibold text-fg">New board</Dialog.Title>
                    <Dialog.Description className="sr-only">Add a board to this workspace.</Dialog.Description>
                  </div>
                  <Dialog.Close
                    type="button"
                    className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg"
                    aria-label="Close"
                  >
                    <X className="size-5" />
                  </Dialog.Close>
                </div>
                <form className="mt-5 space-y-4" onSubmit={(e) => void onCreateBoard(e)}>
                  <label className="block text-xs font-medium text-muted">
                    Name
                    <input
                      className="mt-1.5 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none ring-nav-active/30 focus:ring-2"
                      value={newBoardName}
                      onChange={(e) => setNewBoardName(e.target.value)}
                      placeholder="e.g. Sprint backlog"
                      required
                    />
                  </label>
                  {createBoardError ? <p className="text-xs text-red-500">{createBoardError}</p> : null}
                  <div className="flex justify-end gap-2 pt-1">
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
                      disabled={creatingBoard}
                      className="rounded-lg bg-nav-active px-4 py-2 text-sm font-medium text-nav-active-fg disabled:opacity-50"
                    >
                      {creatingBoard ? 'Creating…' : 'Create'}
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="boards-heading">
          <div className="mb-4 flex items-center gap-2">
            <Layers className="size-4 text-muted" aria-hidden />
            <h2 id="boards-heading" className="text-base font-semibold text-fg">
              Boards
            </h2>
            <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium tabular-nums text-muted">
              {boards.length}
            </span>
          </div>
          {boards.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-8 py-16 text-center text-sm text-muted">
              No boards to show.{displayArchived ? '' : ' Try showing archived boards.'}
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {boards.map((b) => (
                <li key={b.id}>
                  <Link
                    to="/workspaces/$workspaceSlug/boards/$boardId"
                    params={{ workspaceSlug, boardId: String(b.id) }}
                    search={{ view: 'list' }}
                    className="flex h-full min-h-[8.5rem] flex-col rounded-xl border border-border bg-surface-1 p-5 text-left shadow-sm transition hover:border-nav-active/35 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="line-clamp-2 font-semibold text-fg">
                        {(b.name ?? 'Board').trim() || 'Board'}
                      </h3>
                      {b.archived ? (
                        <span className="shrink-0 rounded-md bg-muted/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                          Archived
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-[11px] text-muted tabular-nums">
                      {typeof b.tasks_count === 'number' ? `${b.tasks_count} tasks` : null}
                    </p>
                    <BoardAvatarStrip boardUsers={(b.board_users ?? []) as BoardUserLite[]} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside aria-label="Workspace activity">
          <div className="mt-0 flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-base font-semibold text-fg">Activity</h2>
            <DropdownMenu.Root modal={false}>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-1 px-2.5 py-1.5 text-xs font-medium text-fg shadow-sm ring-1 ring-border transition hover:bg-surface-2"
                >
                  <Filter className="size-3.5 text-muted" aria-hidden />
                  Filters
                  {activityFilterAdjustments > 0 ? (
                    <span className="rounded-md bg-nav-active/25 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-nav-active-fg">
                      {activityFilterAdjustments}
                    </span>
                  ) : null}
                  <ChevronDown className="size-3.5 text-muted" aria-hidden />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={6}
                  className="z-[70] max-h-[min(70vh,24rem)] w-[min(calc(100vw-2rem),16rem)] overflow-y-auto rounded-lg border border-border bg-surface-2 p-2 shadow-xl"
                >
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Time range
                  </p>
                  <DropdownMenu.RadioGroup
                    value={String(activityDays)}
                    onValueChange={(v) => setActivityDays(Number(v))}
                  >
                    {[7, 30, 90].map((d) => (
                      <DropdownMenu.RadioItem
                        key={d}
                        value={String(d)}
                        className="relative flex cursor-pointer select-none items-center rounded px-2 py-1.5 text-xs text-fg outline-none hover:bg-surface-3 focus:bg-surface-3 data-[state=checked]:font-semibold"
                      >
                        Last {d} days
                      </DropdownMenu.RadioItem>
                    ))}
                  </DropdownMenu.RadioGroup>
                  <DropdownMenu.Separator className="my-2 h-px bg-border" />
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Types
                  </p>
                  <p className="px-2 pb-1 text-[10px] text-muted">None selected = all types.</p>
                  {ACTIVITY_TYPE_FILTERS.map((opt) => (
                    <DropdownMenu.CheckboxItem
                      key={opt.value}
                      checked={activityTypeFilter.includes(opt.value)}
                      onCheckedChange={() => toggleActivityType(opt.value)}
                      className="relative flex cursor-pointer select-none items-center gap-2 rounded px-2 py-1.5 text-xs text-fg outline-none hover:bg-surface-3 focus:bg-surface-3"
                      onSelect={(e) => e.preventDefault()}
                    >
                      {opt.label}
                    </DropdownMenu.CheckboxItem>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          <div className="mt-4 space-y-3">
            {activitiesLoading ? (
              <WorkspaceActivityColumnSkeleton />
            ) : (activities ?? []).length === 0 ? (
              <p className="rounded-xl border border-border bg-surface-1 px-4 py-8 text-center text-sm text-muted">
                No activity in this window.
              </p>
            ) : (
              (activities ?? []).map((a, i) => (
                <ActivityCard key={`${activityLineKey(a)}-${i}`} activity={a} />
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

type BoardUserLite = {
  user?: { avatar_url?: string | null; name?: string | null; email?: string }
  avatar_url?: string | null
  name?: string | null
}

function BoardAvatarStrip({ boardUsers }: { boardUsers: BoardUserLite[] }) {
  const urls = boardUsers
    .map((bu) => bu.user?.avatar_url ?? bu.avatar_url)
    .filter((u): u is string => Boolean(u?.trim()))

  if (urls.length === 0) {
    return <div className="mt-auto border-t border-border pt-4" />
  }

  const max = 5
  return (
    <div className="mt-auto flex items-center gap-1 border-t border-border pt-4">
      {urls.slice(0, max).map((url, i) => (
        <img key={i} src={url} alt="" className="-ml-2 first:ml-0 size-8 rounded-full ring-2 ring-surface-1 object-cover" />
      ))}
      {urls.length > max ? (
        <span className="-ml-1 text-[11px] text-muted">+{urls.length - max}</span>
      ) : null}
    </div>
  )
}

function activityLineKey(a: WorkspaceActivity): string {
  return String(a.id ?? a.relative_time ?? a.created_at ?? a.description ?? '')
}

function ActivityCard({ activity }: { activity: WorkspaceActivity }) {
  const text =
    activity.description?.trim() ||
    activity.body?.trim() ||
    activity.activity_type?.replace(/^activity_type_/, '').replace(/_/g, ' ') ||
    'Activity'
  const who =
    activity.user?.display_name?.trim() ||
    activity.user?.name?.trim() ||
    activity.user?.email?.trim() ||
    'Someone'

  return (
    <article className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
      <div className="flex gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-nav-active/15 text-[10px] font-semibold uppercase text-nav-active">
          {who.slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-fg">{who}</p>
          <p className="mt-1 text-sm leading-snug text-muted">{text}</p>
          {(activity.relative_time ?? activity.created_at) ? (
            <p className="mt-2 text-[11px] text-muted">{activity.relative_time ?? activity.created_at}</p>
          ) : null}
        </div>
      </div>
    </article>
  )
}

import * as Dialog from '@radix-ui/react-dialog'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useBoardLayout } from '@/context/BoardLayoutContext'
import { cn } from '@/lib/utils'
import type { BoardDetail, BoardListItem, BoardMember, BoardTag, BoardTask } from '@/services/boards-api'
import {
  deleteTask,
  getBoard,
  listBoards,
  moveTaskToBoard,
  updateTask,
  updateTaskMembers,
  updateTaskTaggings,
} from '@/services/boards-api'

export type KanbanDialogState =
  | { kind: 'tags'; task: BoardTask }
  | { kind: 'members'; task: BoardTask }
  | { kind: 'due'; task: BoardTask }
  | { kind: 'move'; task: BoardTask }
  | { kind: 'delete'; task: BoardTask }
  | null

type KanbanTaskDialogsProps = {
  state: KanbanDialogState
  onClose: () => void
}

function isoFromDatetimeLocal(value: string): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function datetimeLocalFromIso(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function TagsDialogBody({
  task,
  boardTags,
  boardId,
  onClose,
  afterSuccess,
}: {
  task: BoardTask
  boardTags: BoardTag[]
  boardId: string
  onClose: () => void
  afterSuccess: () => Promise<void>
}) {
  const [tagIds, setTagIds] = useState(() => (task.tags ?? []).map((t) => t.id))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
      {boardTags.length === 0 ? (
        <p className="text-sm text-muted">No tags on this board.</p>
      ) : (
        boardTags.map((tag) => {
          const checked = tagIds.includes(tag.id)
          return (
            <label
              key={tag.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  setTagIds((prev) =>
                    checked ? prev.filter((id) => id !== tag.id) : [...prev, tag.id],
                  )
                }}
                className="rounded border-border"
              />
              <span className="text-fg">{tag.name}</span>
            </label>
          )
        })
      )}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded-lg bg-nav-active px-3 py-2 text-sm font-medium text-nav-active-fg disabled:opacity-50"
          onClick={() => {
            setBusy(true)
            setError(null)
            void (async () => {
              try {
                await updateTaskTaggings(boardId, task.id, tagIds)
                await afterSuccess()
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not update tags')
              } finally {
                setBusy(false)
              }
            })()
          }}
        >
          Save
        </button>
      </div>
    </div>
  )
}

function MembersDialogBody({
  task,
  boardMembers,
  boardId,
  onClose,
  afterSuccess,
}: {
  task: BoardTask
  boardMembers: BoardMember[]
  boardId: string
  onClose: () => void
  afterSuccess: () => Promise<void>
}) {
  const [userIds, setUserIds] = useState(() =>
    (task.task_users ?? []).map((u) => u.id).filter((id): id is number => typeof id === 'number'),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
      {boardMembers.length === 0 ? (
        <p className="text-sm text-muted">No members on this board.</p>
      ) : (
        boardMembers.map((m) => {
          const checked = userIds.includes(m.id)
          return (
            <label
              key={m.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  setUserIds((prev) =>
                    checked ? prev.filter((id) => id !== m.id) : [...prev, m.id],
                  )
                }}
                className="rounded border-border"
              />
              <span className="text-fg">{m.name?.trim() || m.email || `User ${m.id}`}</span>
            </label>
          )
        })
      )}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded-lg bg-nav-active px-3 py-2 text-sm font-medium text-nav-active-fg disabled:opacity-50"
          onClick={() => {
            setBusy(true)
            setError(null)
            void (async () => {
              try {
                await updateTaskMembers(boardId, task.id, userIds)
                await afterSuccess()
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not update members')
              } finally {
                setBusy(false)
              }
            })()
          }}
        >
          Save
        </button>
      </div>
    </div>
  )
}

function DueDialogBody({
  task,
  boardId,
  onClose,
  afterSuccess,
}: {
  task: BoardTask
  boardId: string
  onClose: () => void
  afterSuccess: () => Promise<void>
}) {
  const [dueLocal, setDueLocal] = useState(() => datetimeLocalFromIso(task.due_at))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="mt-4 space-y-3">
      <input
        type="datetime-local"
        value={dueLocal}
        onChange={(e) => setDueLocal(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg"
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2"
          onClick={() => setDueLocal('')}
        >
          Clear
        </button>
        <button
          type="button"
          className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded-lg bg-nav-active px-3 py-2 text-sm font-medium text-nav-active-fg disabled:opacity-50"
          onClick={() => {
            setBusy(true)
            setError(null)
            void (async () => {
              try {
                const iso = dueLocal ? isoFromDatetimeLocal(dueLocal) : null
                await updateTask(boardId, task.id, {
                  task: { due_at: iso },
                })
                await afterSuccess()
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not update due date')
              } finally {
                setBusy(false)
              }
            })()
          }}
        >
          Save
        </button>
      </div>
    </div>
  )
}

function MoveDialogBody({
  task,
  board,
  boardId,
  workspaceSlug,
  view,
  navigate,
  onClose,
  refreshBoard,
}: {
  task: BoardTask
  board: BoardDetail
  boardId: string
  workspaceSlug: string
  view: 'list' | 'kanban'
  navigate: ReturnType<typeof useNavigate>
  onClose: () => void
  refreshBoard: () => Promise<void>
}) {
  const [boards, setBoards] = useState<BoardListItem[]>([])
  const [moveBoardId, setMoveBoardId] = useState('')
  const [moveColumnId, setMoveColumnId] = useState('')
  const [columnsBoard, setColumnsBoard] = useState<BoardDetail | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void listBoards()
      .then((b) => {
        if (!cancelled) setBoards(b)
      })
      .catch(() => {
        if (!cancelled) setBoards([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filteredBoards = useMemo(() => {
    const wid = board.workspace_id
    if (wid == null) return boards
    return boards.filter((b) => b.workspace_id === wid || b.id === board.id)
  }, [boards, board.workspace_id, board.id])

  const sortedMoveColumns = useMemo(() => {
    const cols = [...(columnsBoard?.board_columns ?? [])]
    cols.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    return cols
  }, [columnsBoard])

  const onBoardSelect = (id: string) => {
    setMoveBoardId(id)
    setMoveColumnId('')
    setColumnsBoard(null)
    if (id) {
      void getBoard(id)
        .then(setColumnsBoard)
        .catch(() => setColumnsBoard(null))
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <label className="block text-xs font-medium text-muted">
        Board
        <select
          value={moveBoardId}
          onChange={(e) => onBoardSelect(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg"
        >
          <option value="">Select board…</option>
          {filteredBoards.map((b) => (
            <option key={b.id} value={String(b.id)}>
              {b.name?.trim() || `Board ${b.id}`}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-medium text-muted">
        Column
        <select
          value={moveColumnId}
          onChange={(e) => setMoveColumnId(e.target.value)}
          disabled={!moveBoardId || sortedMoveColumns.length === 0}
          className="mt-1 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg disabled:opacity-50"
        >
          <option value="">Select column…</option>
          {sortedMoveColumns.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {(c.name ?? 'Column').trim()}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy || !moveBoardId || !moveColumnId}
          className="rounded-lg bg-nav-active px-3 py-2 text-sm font-medium text-nav-active-fg disabled:opacity-50"
          onClick={() => {
            setBusy(true)
            setError(null)
            void (async () => {
              try {
                const selected = filteredBoards.find((b) => String(b.id) === moveBoardId)
                await moveTaskToBoard(boardId, task.id, moveBoardId, moveColumnId)
                onClose()
                await refreshBoard()
                const slug = selected?.workspace?.slug ?? workspaceSlug
                if (String(selected?.id) !== boardId) {
                  navigate({
                    to: '/workspaces/$workspaceSlug/boards/$boardId',
                    params: { workspaceSlug: slug, boardId: moveBoardId },
                    search: { view },
                  })
                }
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not move task')
              } finally {
                setBusy(false)
              }
            })()
          }}
        >
          Move
        </button>
      </div>
    </div>
  )
}

function DeleteDialogBody({
  task,
  boardId,
  workspaceSlug,
  view,
  navigate,
  onClose,
  refreshBoard,
}: {
  task: BoardTask
  boardId: string
  workspaceSlug: string
  view: 'list' | 'kanban'
  navigate: ReturnType<typeof useNavigate>
  onClose: () => void
  refreshBoard: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-muted">
        Delete &ldquo;{(task.name ?? '').trim() || 'Untitled'}&rdquo;? This cannot be undone.
      </p>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={() => {
            setBusy(true)
            setError(null)
            void (async () => {
              try {
                await deleteTask(boardId, task.id)
                onClose()
                await refreshBoard()
                navigate({
                  to: '/workspaces/$workspaceSlug/boards/$boardId',
                  params: { workspaceSlug, boardId },
                  search: { view },
                })
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Could not delete task')
              } finally {
                setBusy(false)
              }
            })()
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export function KanbanTaskDialogs({ state, onClose }: KanbanTaskDialogsProps) {
  const { boardId, board, boardTags, boardMembers, workspaceSlug, refreshBoard } = useBoardLayout()
  const navigate = useNavigate()
  const view: 'list' | 'kanban' = useRouterState({
    select: (s) => {
      const v = (s.location.search as { view?: string })?.view
      return v === 'kanban' ? 'kanban' : 'list'
    },
  })

  const open = state != null
  const task = state?.task ?? null
  const kind = state?.kind

  const afterSuccess = useCallback(async () => {
    await refreshBoard()
    onClose()
  }, [refreshBoard, onClose])

  const title =
    kind === 'tags'
      ? 'Tags'
      : kind === 'members'
        ? 'Members'
        : kind === 'due'
          ? 'Due date'
          : kind === 'move'
            ? 'Move task'
            : kind === 'delete'
              ? 'Delete task'
              : ''

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-[110] w-[min(100vw-2rem,26rem)] max-h-[min(90vh,32rem)] -translate-x-1/2 -translate-y-1/2',
            'rounded-xl border border-border bg-surface-1 p-4 shadow-lg outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        >
          <Dialog.Title className="text-sm font-semibold text-fg">{title}</Dialog.Title>
          <Dialog.Description className="sr-only">
            {kind === 'delete' ? 'Confirm deleting this task.' : `Update ${title.toLowerCase()} for this task.`}
          </Dialog.Description>

          {task && kind === 'tags' ? (
            <TagsDialogBody
              key={task.id}
              task={task}
              boardTags={boardTags}
              boardId={boardId}
              onClose={onClose}
              afterSuccess={afterSuccess}
            />
          ) : null}

          {task && kind === 'members' ? (
            <MembersDialogBody
              key={task.id}
              task={task}
              boardMembers={boardMembers}
              boardId={boardId}
              onClose={onClose}
              afterSuccess={afterSuccess}
            />
          ) : null}

          {task && kind === 'due' ? (
            <DueDialogBody
              key={task.id}
              task={task}
              boardId={boardId}
              onClose={onClose}
              afterSuccess={afterSuccess}
            />
          ) : null}

          {task && kind === 'move' ? (
            <MoveDialogBody
              key={task.id}
              task={task}
              board={board}
              boardId={boardId}
              workspaceSlug={workspaceSlug}
              view={view}
              navigate={navigate}
              onClose={onClose}
              refreshBoard={refreshBoard}
            />
          ) : null}

          {task && kind === 'delete' ? (
            <DeleteDialogBody
              key={task.id}
              task={task}
              boardId={boardId}
              workspaceSlug={workspaceSlug}
              view={view}
              navigate={navigate}
              onClose={onClose}
              refreshBoard={refreshBoard}
            />
          ) : null}

          <Dialog.Close className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
            <span className="sr-only">Close</span>
            ×
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

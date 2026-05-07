import {
  type DragEndEvent,
  DndContext,
  type UniqueIdentifier,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { generateKeyBetween } from 'fractional-indexing'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { KanbanColumn } from '@/components/board/KanbanColumn'
import {
  KanbanTaskDialogs,
  type KanbanDialogState,
} from '@/components/board/KanbanTaskDialogs'
import { useBoardLayout } from '@/context/BoardLayoutContext'
import type { BoardDetail, BoardTask } from '@/services/boards-api'
import { getBoard, updateTask } from '@/services/boards-api'

type ItemsByColumn = Record<string, string[]>

function sortTasks(tasks: BoardTask[]): BoardTask[] {
  return [...tasks].sort((a, b) =>
    (a.sort_key ?? '').localeCompare(b.sort_key ?? '', undefined, { sensitivity: 'base' }),
  )
}

function buildItemsMap(board: BoardDetail): ItemsByColumn {
  const cols = [...(board.board_columns ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  const out: ItemsByColumn = {}
  for (const col of cols) {
    out[String(col.id)] = sortTasks(col.tasks ?? []).map((t) => String(t.id))
  }
  return out
}

function findContainer(items: ItemsByColumn, id: UniqueIdentifier): string | undefined {
  const s = String(id)
  if (s.startsWith('col-drop-')) return s.replace('col-drop-', '')
  if (s in items) return s
  for (const colId of Object.keys(items)) {
    if (items[colId].includes(s)) return colId
  }
  return undefined
}

function cloneItems(items: ItemsByColumn): ItemsByColumn {
  return Object.fromEntries(Object.entries(items).map(([k, v]) => [k, [...v]]))
}

export function BoardKanban() {
  const { board, setBoard, boardId } = useBoardLayout()
  const [fullBadges, setFullBadges] = useState(false)
  const [dialog, setDialog] = useState<KanbanDialogState>(null)
  const columns = useMemo(
    () =>
      [...(board.board_columns ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [board.board_columns],
  )

  const [items, setItems] = useState<ItemsByColumn>(() => buildItemsMap(board))

  useEffect(() => {
    const id = requestAnimationFrame(() => setItems(buildItemsMap(board)))
    return () => cancelAnimationFrame(id)
  }, [board])

  const tasksById = useMemo(() => {
    const m = new Map<string, BoardTask>()
    for (const col of board.board_columns ?? []) {
      for (const t of col.tasks ?? []) {
        m.set(String(t.id), t)
      }
    }
    return m
  }, [board.board_columns])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const rebuildBoardFromItems = useCallback(
    (nextItems: ItemsByColumn): BoardDetail => {
      const next = JSON.parse(JSON.stringify(board)) as BoardDetail
      for (const col of next.board_columns ?? []) {
        const ids = nextItems[String(col.id)] ?? []
        col.tasks = ids
          .map((id) => {
            const base = tasksById.get(id)
            if (!base) return null
            return {
              ...base,
              board_column_id: col.id,
            } satisfies BoardTask
          })
          .filter((t): t is BoardTask => t != null)
      }
      return next
    },
    [board, tasksById],
  )

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const activeContainer = findContainer(items, active.id)
      let overContainer = findContainer(items, over.id)
      if (!activeContainer) return
      if (!overContainer && String(over.id).startsWith('col-drop-')) {
        overContainer = String(over.id).replace('col-drop-', '')
      }
      if (!overContainer) return

      const next = cloneItems(items)
      const srcList = next[activeContainer]
      const from = srcList.indexOf(String(active.id))
      if (from === -1) return

      if (activeContainer === overContainer) {
        const destList = next[activeContainer]
        const oldIndex = destList.indexOf(String(active.id))
        const newIndex = destList.indexOf(String(over.id))
        if (oldIndex === -1) return
        if (newIndex === -1) return
        next[activeContainer] = arrayMove(destList, oldIndex, newIndex)
      } else {
        const [mv] = srcList.splice(from, 1)
        const destList = next[overContainer]
        if (String(over.id).startsWith('col-drop-')) {
          destList.push(mv)
        } else {
          const ti = destList.indexOf(String(over.id))
          if (ti === -1) destList.push(mv)
          else destList.splice(ti, 0, mv)
        }
      }

      setItems(next)
      const destCol = Number(overContainer)
      const destOrder = next[overContainer]
      const movedId = String(active.id)

      const idx = destOrder.indexOf(movedId)
      if (idx === -1) return
      const prevKey = idx > 0 ? tasksById.get(destOrder[idx - 1])?.sort_key : null
      const nextKey =
        idx < destOrder.length - 1 ? tasksById.get(destOrder[idx + 1])?.sort_key : null
      const newKey = generateKeyBetween(prevKey ?? null, nextKey ?? null)

      const nextBoard = rebuildBoardFromItems(next)
      for (const col of nextBoard.board_columns ?? []) {
        const t = col.tasks?.find((x) => String(x.id) === movedId)
        if (t && col.id === destCol) {
          t.sort_key = newKey
          t.board_column_id = destCol
        }
      }
      setBoard(nextBoard)

      try {
        await updateTask(boardId, movedId, {
          task: {
            board_column_id: destCol,
            sort_key: newKey,
          },
        })
      } catch {
        const fresh = await getBoard(boardId)
        setBoard(fresh)
      }
    },
    [boardId, items, rebuildBoardFromItems, setBoard, tasksById],
  )

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-end border-b border-border px-2 py-1.5">
          <button
            type="button"
            onClick={() => setFullBadges((v) => !v)}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-muted transition hover:bg-surface-2 hover:text-fg"
          >
            {fullBadges ? 'Compact tags' : 'Full tags'}
          </button>
        </div>
        <div className="min-h-0 min-w-0 flex-1">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={(e) => void onDragEnd(e)}>
            <div className="box-border flex h-full min-h-0 gap-3 overflow-x-auto overflow-y-hidden p-0 pb-1">
              {columns.map((col) => (
                <SortableContext
                  key={col.id}
                  items={items[String(col.id)] ?? []}
                  strategy={verticalListSortingStrategy}
                >
                  <KanbanColumn
                    column={col}
                    taskIds={items[String(col.id)] ?? []}
                    tasksById={tasksById}
                    isFullBadgeDisplay={fullBadges}
                    onOpenDialog={setDialog}
                  />
                </SortableContext>
              ))}
            </div>
          </DndContext>
        </div>
      </div>
      <KanbanTaskDialogs state={dialog} onClose={() => setDialog(null)} />
    </>
  )
}

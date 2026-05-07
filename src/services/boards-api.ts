import { z } from 'zod'
import { apiRequest } from '@/lib/api'

const boardCreatedSchema = z
  .object({
    id: z.number(),
    name: z.string().nullable().optional(),
  })
  .passthrough()

export type BoardCreated = z.infer<typeof boardCreatedSchema>

const taskUserSchema = z
  .object({
    role: z.string().optional(),
    id: z.number().optional(),
    email: z.string().optional(),
    name: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
  })
  .passthrough()

const taskTagSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    color: z.string().nullable().optional(),
  })
  .passthrough()

const taskCheckItemSchema = z
  .object({
    id: z.number(),
    is_complete: z.boolean().optional(),
  })
  .passthrough()

const taskChecklistSchema = z
  .object({
    id: z.number(),
    task_check_items: z.array(taskCheckItemSchema).optional(),
  })
  .passthrough()

const taskLiteSchema = z
  .object({
    id: z.number(),
    name: z.string().nullable().optional(),
    body: z.string().nullable().optional(),
    board_column_id: z.number(),
    sort_key: z.string().nullable().optional(),
    due_at: z.string().nullable().optional(),
    archived: z.boolean().optional(),
    position: z.number().nullable().optional(),
    task_users: z.array(taskUserSchema).optional(),
    tags: z.array(taskTagSchema).optional(),
    stopwatch_started_at: z.string().nullable().optional(),
    stopwatch_elapsed_seconds: z.number().nullable().optional(),
    task_checklists: z.array(taskChecklistSchema).optional(),
  })
  .passthrough()

const boardColumnSchema = z
  .object({
    id: z.number(),
    name: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    position: z.number().nullable().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    tasks: z.array(taskLiteSchema).optional(),
  })
  .passthrough()

const boardDetailSchema = z
  .object({
    id: z.number(),
    name: z.string().nullable().optional(),
    archived: z.boolean().optional(),
    visibility: z.string().optional(),
    description: z.string().nullable().optional(),
    todo_board_column_id: z.number().nullable().optional(),
    done_board_column_id: z.number().nullable().optional(),
    in_review_board_column_id: z.number().nullable().optional(),
    board_columns: z.array(boardColumnSchema).optional(),
    time_tracking_enabled: z.boolean().optional(),
    workspace_id: z.number().optional(),
  })
  .passthrough()

export type BoardTask = z.infer<typeof taskLiteSchema>
export type BoardColumn = z.infer<typeof boardColumnSchema>
export type BoardDetail = z.infer<typeof boardDetailSchema>
export type BoardTag = z.infer<typeof taskTagSchema>

const boardMemberUserSchema = z
  .object({
    id: z.number(),
    name: z.string().nullable().optional(),
    email: z.string().optional(),
    avatar_url: z.string().nullable().optional(),
  })
  .passthrough()

const boardMemberRowSchema = z
  .object({
    id: z.number().optional(),
    user: boardMemberUserSchema.optional(),
  })
  .passthrough()

export type BoardMember = {
  id: number
  name: string | null | undefined
  email: string | undefined
  avatar_url: string | null | undefined
}

const boardListItemSchema = z
  .object({
    id: z.number(),
    name: z.string().nullable().optional(),
    archived: z.boolean().optional(),
    workspace_id: z.number().optional(),
    workspace: z
      .object({
        id: z.number(),
        name: z.string().optional(),
        slug: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

export type BoardListItem = z.infer<typeof boardListItemSchema>

export async function createBoard(input: {
  name: string
  /** Friendly id or numeric id of the workspace */
  workspaceId: string | number
}): Promise<BoardCreated> {
  const raw = await apiRequest<unknown>('/boards', {
    method: 'POST',
    body: {
      board: {
        name: input.name.trim(),
        workspace_id: input.workspaceId,
      },
    },
  })
  const parsed = boardCreatedSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error('Invalid board response')
  }
  return parsed.data
}

export async function getBoard(
  boardId: string | number,
  opts?: { showArchived?: boolean },
): Promise<BoardDetail> {
  const q = opts?.showArchived ? '?show_archived=true' : ''
  const raw = await apiRequest<unknown>(`/boards/${boardId}.json${q}`)
  const parsed = boardDetailSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error('Invalid board response')
  }
  return parsed.data
}

export async function listBoards(): Promise<z.infer<typeof boardListItemSchema>[]> {
  const raw = await apiRequest<unknown>('/boards.json')
  const parsed = z.array(boardListItemSchema).safeParse(raw)
  if (!parsed.success) {
    throw new Error('Invalid boards list response')
  }
  return parsed.data
}

function normalizeBoardMembers(raw: unknown): BoardMember[] {
  const parsed = z.array(boardMemberRowSchema).safeParse(raw)
  if (!parsed.success) return []
  const out: BoardMember[] = []
  for (const row of parsed.data) {
    const u = row.user
    if (u?.id != null) {
      out.push({
        id: u.id,
        name: u.name,
        email: u.email,
        avatar_url: u.avatar_url ?? null,
      })
    }
  }
  return out
}

export async function getBoardTags(boardId: string | number): Promise<BoardTag[]> {
  const raw = await apiRequest<unknown>(`/boards/${boardId}/tags.json`)
  const parsed = z.array(taskTagSchema).safeParse(raw)
  return parsed.success ? parsed.data : []
}

export async function getBoardMembers(boardId: string | number): Promise<BoardMember[]> {
  const raw = await apiRequest<unknown>(`/boards/${boardId}/board_users.json`)
  return normalizeBoardMembers(raw)
}

export async function updateTaskTaggings(
  boardId: string | number,
  taskId: string | number,
  tagIds: number[],
): Promise<unknown> {
  return apiRequest<unknown>(`/boards/${boardId}/tasks/${taskId}/taggings.json`, {
    method: 'PUT',
    body: { tag_ids: tagIds },
  })
}

export async function updateTaskMembers(
  boardId: string | number,
  taskId: string | number,
  userIds: number[],
): Promise<unknown> {
  return apiRequest<unknown>(`/boards/${boardId}/tasks/${taskId}/task_users.json`, {
    method: 'PUT',
    body: { user_ids: userIds },
  })
}

export async function deleteTask(boardId: string | number, taskId: string | number): Promise<unknown> {
  return apiRequest<unknown>(`/boards/${boardId}/tasks/${taskId}.json`, {
    method: 'DELETE',
  })
}

export async function moveTaskToBoard(
  fromBoardId: string | number,
  taskId: string | number,
  toBoardId: string | number,
  toColumnId: string | number,
): Promise<unknown> {
  return apiRequest<unknown>(`/boards/${fromBoardId}/tasks/${taskId}/move.json`, {
    method: 'PUT',
    body: { to_board_id: toBoardId, to_column_id: toColumnId },
  })
}

export async function toggleTaskStopwatch(
  boardId: string | number,
  taskId: string | number,
): Promise<unknown> {
  return apiRequest<unknown>(`/boards/${boardId}/tasks/${taskId}/stopwatch.json`, {
    method: 'PUT',
  })
}

export type UpdateTaskPayload = {
  /** Nested task attributes (Rails strong params) */
  task?: {
    name?: string
    body?: string | null
    board_column_id?: number
    due_at?: string | null
    sort_key?: string | null
  }
  /** Top-level: required for reposition / sort_key calculation in Rails */
  board_column_id?: number
  insert_after_task_id?: number | null
}

/**
 * Updates a task. Sends `task` for attribute changes; include top-level `board_column_id`
 * and optional `insert_after_task_id` when moving/reordering (matches tarefas-backend).
 */
export async function updateTask(
  boardId: string | number,
  taskId: string | number,
  payload: UpdateTaskPayload,
): Promise<unknown> {
  const body: Record<string, unknown> = {}
  if (payload.task !== undefined) body.task = payload.task
  if (payload.board_column_id !== undefined) body.board_column_id = payload.board_column_id
  if (payload.insert_after_task_id !== undefined) body.insert_after_task_id = payload.insert_after_task_id
  return apiRequest<unknown>(`/boards/${boardId}/tasks/${taskId}.json`, {
    method: 'PUT',
    body,
  })
}


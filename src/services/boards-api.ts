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
  })
  .passthrough()

export type BoardTask = z.infer<typeof taskLiteSchema>
export type BoardColumn = z.infer<typeof boardColumnSchema>
export type BoardDetail = z.infer<typeof boardDetailSchema>

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


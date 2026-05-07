import { z } from 'zod'
import { apiRequest } from '@/lib/api'

import { wsPathSegment } from '@/services/workspace-path'

const boardPartialSchema = z
  .object({
    id: z.number(),
    name: z.string().nullable().optional(),
    archived: z.boolean().optional(),
    tasks_count: z.number().optional(),
    board_users: z
      .array(
        z
          .object({
            id: z.number().optional(),
            role: z.string().optional(),
            user: z
              .object({
                id: z.number(),
                email: z.string().optional(),
                name: z.string().nullable().optional(),
                avatar_url: z.string().nullable().optional(),
              })
              .passthrough()
              .optional(),
            avatar_url: z.string().nullable().optional(),
            name: z.string().nullable().optional(),
            email: z.string().optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough()

const workspaceSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    boards: z.array(boardPartialSchema).optional(),
  })
  .passthrough()

const workspaceDetailSchema = workspaceSchema.extend({
  workspace_documents: z.array(z.unknown()).optional(),
  /** Rails show view may flatten user fields — keep loose */
  workspace_users: z.array(z.record(z.string(), z.unknown())).optional(),
})

export type WorkspaceListItem = z.infer<typeof workspaceSchema>

export type WorkspaceDetail = z.infer<typeof workspaceDetailSchema>

export type Workspace = WorkspaceListItem

/** When `token` is passed, that JWT is used; otherwise reads from the stored session. */
export async function listWorkspaces(token?: string): Promise<Workspace[]> {
  const raw = await apiRequest<unknown>('/workspaces', {
    ...(token !== undefined ? { token } : {}),
  })
  const parsed = z.array(workspaceSchema).safeParse(raw)
  if (!parsed.success) {
    throw new Error('Invalid workspaces response')
  }
  return parsed.data
}

export async function createWorkspace(name: string): Promise<Workspace> {
  const raw = await apiRequest<unknown>('/workspaces', {
    method: 'POST',
    body: { workspace: { name: name.trim() } },
  })
  const parsed = workspaceSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error('Invalid workspace response')
  }
  return parsed.data
}

export async function getWorkspace(slug: string): Promise<WorkspaceDetail> {
  const raw = await apiRequest<unknown>(`/workspaces/${wsPathSegment(slug)}`)
  const parsed = workspaceDetailSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error('Invalid workspace response')
  }
  return parsed.data
}

export async function updateWorkspace(slug: string, name: string): Promise<WorkspaceDetail> {
  const raw = await apiRequest<unknown>(`/workspaces/${wsPathSegment(slug)}`, {
    method: 'PUT',
    body: { workspace: { name: name.trim() } },
  })
  const parsed = workspaceDetailSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error('Invalid workspace response')
  }
  return parsed.data
}

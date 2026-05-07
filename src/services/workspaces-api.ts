import { z } from 'zod'
import { apiRequest } from '@/lib/api'

const boardSchema = z
  .object({
    id: z.number(),
    name: z.string().nullable().optional(),
    archived: z.boolean().optional(),
  })
  .passthrough()

const workspaceSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable().optional(),
    boards: z.array(boardSchema).optional(),
  })
  .passthrough()

export type Workspace = z.infer<typeof workspaceSchema>

export async function listWorkspaces(): Promise<Workspace[]> {
  const raw = await apiRequest<unknown>('/workspaces')
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

import { z } from 'zod'
import { apiRequest } from '@/lib/api'

const workspaceMemberUserSchema = z
  .object({
    id: z.number(),
    email: z.string(),
    name: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
  })
  .passthrough()

export const workspaceMemberSchema = z
  .object({
    id: z.number(),
    role: z.string(),
    created_at: z.string().optional(),
    user: workspaceMemberUserSchema,
  })
  .passthrough()

export type WorkspaceMember = z.infer<typeof workspaceMemberSchema>

import { wsPathSegment } from '@/services/workspace-path'

export async function listWorkspaceUsers(slug: string): Promise<WorkspaceMember[]> {
  const raw = await apiRequest<unknown>(`/workspaces/${wsPathSegment(slug)}/workspace_users`)
  const parsed = z.array(workspaceMemberSchema).safeParse(raw)
  if (!parsed.success) {
    throw new Error('Invalid workspace members response')
  }
  return parsed.data
}

export async function inviteWorkspaceUserByEmail(slug: string, email: string): Promise<void> {
  await apiRequest<unknown>(`/workspaces/${wsPathSegment(slug)}/workspace_users/share`, {
    method: 'POST',
    body: { email: email.trim().toLowerCase() },
  })
}

export async function updateWorkspaceMemberRole(
  slug: string,
  workspaceUserId: number,
  role: string,
): Promise<void> {
  await apiRequest<unknown>(
    `/workspaces/${wsPathSegment(slug)}/workspace_users/${workspaceUserId}`,
    {
      method: 'PUT',
      body: { workspace_user: { role } },
    },
  )
}

export async function removeWorkspaceMember(slug: string, workspaceUserId: number): Promise<void> {
  await apiRequest<unknown>(
    `/workspaces/${wsPathSegment(slug)}/workspace_users/${workspaceUserId}`,
    {
      method: 'DELETE',
    },
  )
}

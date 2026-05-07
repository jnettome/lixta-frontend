import { z } from 'zod'
import { apiRequest } from '@/lib/api'

import { wsPathSegment } from '@/services/workspace-path'

export const workspaceActivitySchema = z
  .object({
    id: z.union([z.number(), z.string()]).optional(),
    activity_type: z.string().nullable().optional(),
    body: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    relative_time: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
    user: z
      .object({
        display_name: z.string().nullable().optional(),
        name: z.string().nullable().optional(),
        email: z.string().nullable().optional(),
      })
      .passthrough()
      .optional(),
    task: z
      .object({
        name: z.string().nullable().optional(),
        board_name: z.string().nullable().optional(),
      })
      .passthrough()
      .optional(),
    board: z
      .object({
        id: z.number().optional(),
        name: z.string().nullable().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

export type WorkspaceActivity = z.infer<typeof workspaceActivitySchema>

export type ListActivitiesOptions = {
  days?: number
  activityTypes?: string[]
}

export function buildActivitiesQuery(opts: ListActivitiesOptions): string {
  const sp = new URLSearchParams()
  if (opts.days != null) sp.set('days', String(opts.days))
  for (const t of opts.activityTypes ?? []) {
    sp.append('activity_types[]', t)
  }
  const q = sp.toString()
  return q ? `?${q}` : ''
}

export async function listWorkspaceActivities(
  slug: string,
  opts: ListActivitiesOptions = {},
): Promise<WorkspaceActivity[]> {
  const q = buildActivitiesQuery(opts)
  const raw = await apiRequest<unknown>(
    `/workspaces/${wsPathSegment(slug)}/workspace_activities${q}`,
  )
  const parsed = z.array(workspaceActivitySchema).safeParse(raw)
  if (!parsed.success) {
    throw new Error('Invalid workspace activities response')
  }
  return parsed.data
}

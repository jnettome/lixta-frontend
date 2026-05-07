import { z } from 'zod'
import { apiRequest } from '@/lib/api'
import type { ApiUser } from '@/auth/session'

const apiUserSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  cellphone: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  username: z.string().nullable().optional(),
})

function normalizeUser(u: z.infer<typeof apiUserSchema>): ApiUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    avatar_url: u.avatar_url ?? null,
    cellphone: u.cellphone ?? null,
    created_at: u.created_at,
    updated_at: u.updated_at,
    username: u.username ?? null,
  }
}

const loginResponseSchema = z.object({
  user: apiUserSchema,
  token: z.string(),
})

export type LoginSuccess = {
  user: ApiUser
  token: string
}

export async function loginRequest(email: string, otp: string): Promise<LoginSuccess> {
  const raw = await apiRequest<unknown>('/login', {
    method: 'POST',
    body: { email, otp },
    token: null,
    skipUnauthorizedClear: true,
  })
  const parsed = loginResponseSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error('Invalid login response')
  }
  return {
    user: normalizeUser(parsed.data.user),
    token: parsed.data.token,
  }
}

export async function getMe(token?: string): Promise<ApiUser> {
  const raw = await apiRequest<unknown>('/me', {
    token: token ?? undefined,
  })
  const parsed = apiUserSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error('Invalid user response')
  }
  return normalizeUser(parsed.data)
}

export async function updateMe(
  data: Partial<Pick<ApiUser, 'name' | 'email' | 'cellphone' | 'avatar_url' | 'username'>>,
): Promise<ApiUser> {
  const raw = await apiRequest<unknown>('/me', {
    method: 'PUT',
    body: { user: data },
  })
  const parsed = apiUserSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error('Invalid user response')
  }
  return normalizeUser(parsed.data)
}

export type AvatarPresignResult = {
  url: string
  public_url: string
}

export async function avatarPresign(fileName: string): Promise<AvatarPresignResult> {
  return apiRequest<AvatarPresignResult>('/avatar_presign', {
    method: 'POST',
    body: { file_name: fileName },
  })
}

export async function logoutRequest(): Promise<void> {
  await apiRequest<Record<string, never>>('/logout', {
    method: 'POST',
    body: {},
  })
}

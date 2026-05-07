import { clearAuthSession, getToken } from '@/auth/session'
import { getApiBaseUrl } from '@/lib/env'

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

type RequestOptions = {
  method?: string
  body?: unknown
  /** If omitted, uses token from session when present */
  token?: string | null
  /** When true, do not strip session on 401 (e.g. login) */
  skipUnauthorizedClear?: boolean
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p}`
}

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, token, skipUnauthorizedClear }: RequestOptions = {},
): Promise<T> {
  const base = getApiBaseUrl()
  const url = joinUrl(base, path)
  const authToken = token !== undefined ? token : getToken()

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/json',
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let parsed: unknown = null
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text) as unknown
    } catch {
      parsed = text
    }
  }

  // Only treat 401 as "session invalid" when we actually sent a Bearer token.
  // Otherwise a stray unauthenticated request could clear a valid session (e.g. race after login).
  const hadAuth = Boolean(authToken)
  if (res.status === 401 && !skipUnauthorizedClear && hadAuth) {
    clearAuthSession()
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.assign('/login')
    }
  }

  if (!res.ok) {
    const msg =
      typeof parsed === 'object' && parsed !== null && 'error' in parsed
        ? String((parsed as { error: unknown }).error)
        : res.statusText || 'Request failed'
    throw new ApiError(msg, res.status, parsed)
  }

  return parsed as T
}

/** Upload raw bytes to a presigned URL (S3). */
export async function putBinary(url: string, data: Blob, contentType: string): Promise<void> {
  const res = await fetch(url, {
    method: 'PUT',
    body: data,
    headers: { 'Content-Type': contentType },
  })
  if (!res.ok) {
    throw new ApiError('Upload failed', res.status, await res.text())
  }
}

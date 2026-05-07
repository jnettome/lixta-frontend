import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/auth/AuthContext'
import type { ApiUser } from '@/auth/session'
import { putBinary } from '@/lib/api'
import { avatarPresign, updateMe } from '@/services/auth-api'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/account')({
  component: AccountPage,
})

function userInitials(name: string | null | undefined, email: string): string {
  const n = name?.trim()
  if (n) {
    return n
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

type AccountEditorProps = {
  user: ApiUser
  refreshUser: () => Promise<void>
  onNotice: (msg: string | null) => void
  onError: (msg: string | null) => void
}

function AccountEditor({ user, refreshUser, onNotice, onError }: AccountEditorProps) {
  const [name, setName] = useState(user.name ?? '')
  const [cellphone, setCellphone] = useState(user.cellphone ?? '')
  const [username, setUsername] = useState(user.username ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    onNotice(null)
    onError(null)
    try {
      const updated = await updateMe({
        name: name || null,
        cellphone: cellphone || null,
        username: username || null,
      })
      setName(updated.name ?? '')
      setCellphone(updated.cellphone ?? '')
      setUsername(updated.username ?? '')
      await refreshUser()
      onNotice('Profile saved')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    onError(null)
    onNotice(null)
    try {
      const { url, public_url: publicUrl } = await avatarPresign(file.name)
      await putBinary(url, file, 'application/octet-stream')
      await updateMe({ avatar_url: publicUrl })
      await refreshUser()
      onNotice('Photo updated')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <>
      <div className="flex items-center gap-4">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="size-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-surface-3 text-sm font-semibold text-fg">
            {userInitials(user.name, user.email)}
          </span>
        )}
        <div>
          <label className="block text-xs font-medium text-muted">
            Photo
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              className="mt-1 block w-full text-xs text-fg file:mr-2 file:rounded-md file:border-0 file:bg-surface-2 file:px-2 file:py-1.5 file:text-xs file:font-medium"
              onChange={(ev) => void onAvatarChange(ev)}
            />
          </label>
          {uploading ? <p className="mt-1 text-xs text-muted">Uploading…</p> : null}
        </div>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <label className="block text-xs font-medium text-muted">
          Name
          <input
            className="mt-1 w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-fg outline-none ring-nav-active/40 focus:ring-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>
        <label className="block text-xs font-medium text-muted">
          Email
          <input
            className="mt-1 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-muted outline-none"
            value={user.email}
            readOnly
            disabled
          />
        </label>
        <label className="block text-xs font-medium text-muted">
          Phone
          <input
            className="mt-1 w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-fg outline-none ring-nav-active/40 focus:ring-2"
            value={cellphone}
            onChange={(e) => setCellphone(e.target.value)}
            autoComplete="tel"
          />
        </label>
        <label className="block text-xs font-medium text-muted">
          Username
          <input
            className="mt-1 w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-sm text-fg outline-none ring-nav-active/40 focus:ring-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-nav-active px-3 py-2 text-sm font-medium text-nav-active-fg transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </>
  )
}

function AccountPage() {
  const { session, refreshUser } = useAuth()
  const user = session?.user
  const [formEpoch, setFormEpoch] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void refreshUser()
      .then(() => setFormEpoch((n) => n + 1))
      .catch(() => {
        /* 401 handled globally */
      })
  }, [refreshUser])

  if (!user) {
    return null
  }

  return (
    <div
      className={cn(
        'min-h-full bg-surface-0 px-4 py-8',
        'pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]',
      )}
    >
      <div className="mx-auto w-full max-w-md space-y-8">
        <div>
          <Link
            to="/dashboard"
            className="text-xs font-medium text-muted hover:text-fg"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-fg">Profile</h1>
          <p className="mt-1 text-sm text-muted">Manage your account details.</p>
        </div>

        {notice ? <p className="text-xs text-green-600 dark:text-green-400">{notice}</p> : null}
        {error ? <p className="text-xs text-red-500">{error}</p> : null}

        <AccountEditor
          key={formEpoch}
          user={user}
          refreshUser={refreshUser}
          onNotice={setNotice}
          onError={setError}
        />
      </div>
    </div>
  )
}

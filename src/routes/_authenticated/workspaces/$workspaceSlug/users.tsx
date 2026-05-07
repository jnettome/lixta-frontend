import { Link, createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import { useAuth } from '@/auth/AuthContext'
import type { WorkspaceMember } from '@/services/workspace-users-api'
import {
  inviteWorkspaceUserByEmail,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from '@/services/workspace-users-api'
import { useWorkspaceLayout } from '@/context/WorkspaceLayoutContext'

const ROLES = [
  { value: 'role_viewer', label: 'Viewer' },
  { value: 'role_member', label: 'Member' },
  { value: 'role_admin', label: 'Admin' },
]

export const Route = createFileRoute('/_authenticated/workspaces/$workspaceSlug/users')({
  component: WorkspaceUsersPage,
})

function WorkspaceUsersPage() {
  const { workspaceSlug, members, refreshWorkspace } = useWorkspaceLayout()
  const { session } = useAuth()
  const currentUserId = session?.user.id

  const canManageUsers = useMemo(() => {
    if (currentUserId == null) return false
    return members.some((m) => m.user.id === currentUserId && m.role === 'role_admin')
  }, [currentUserId, members])

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  async function onInvite(e: React.FormEvent) {
    e.preventDefault()
    const email = inviteEmail.trim()
    if (!email || !canManageUsers) return
    setInviting(true)
    setInviteError(null)
    try {
      await inviteWorkspaceUserByEmail(workspaceSlug, email)
      setInviteEmail('')
      await refreshWorkspace()
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Invite failed')
    } finally {
      setInviting(false)
    }
  }

  async function onRoleChange(m: WorkspaceMember, role: string) {
    if (!canManageUsers) return
    try {
      await updateWorkspaceMemberRole(workspaceSlug, m.id, role)
      await refreshWorkspace()
    } catch {
      await refreshWorkspace()
    }
  }

  async function onRemove(m: WorkspaceMember) {
    if (!canManageUsers) return
    const label = m.user?.name ?? m.user?.email ?? 'member'
    if (typeof window !== 'undefined' && !window.confirm(`Remove ${label} from this workspace?`))
      return
    try {
      await removeWorkspaceMember(workspaceSlug, m.id)
      await refreshWorkspace()
    } catch {
      await refreshWorkspace()
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/workspaces/$workspaceSlug"
          params={{ workspaceSlug }}
          className="text-xs font-medium text-muted hover:text-fg"
        >
          Overview
        </Link>
        <p className="text-sm text-muted">
          {members.length} member{members.length === 1 ? '' : 's'}
        </p>
      </div>

      {canManageUsers ? (
        <section className="rounded-xl border border-border bg-surface-1 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-fg">Invite by email</h2>
          <p className="mt-1 text-sm text-muted">They receive access according to workspace rules.</p>
          <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={(e) => void onInvite(e)}>
            <input
              type="email"
              className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none ring-nav-active/30 focus:ring-2"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={inviting}
              required
            />
            <button
              type="submit"
              disabled={inviting}
              className="rounded-lg bg-nav-active px-4 py-2 text-sm font-medium text-nav-active-fg disabled:opacity-50"
            >
              {inviting ? 'Sending…' : 'Invite'}
            </button>
          </form>
          {inviteError ? <p className="mt-2 text-xs text-red-500">{inviteError}</p> : null}
        </section>
      ) : null}

      <section className="rounded-xl border border-border bg-surface-1 shadow-sm">
        <header className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-fg">Members</h2>
        </header>
        {members.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted">No members yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  {m.user?.avatar_url ? (
                    <img
                      src={m.user.avatar_url}
                      alt=""
                      className="size-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-3 text-xs font-semibold uppercase text-muted">
                      {(m.user?.name ?? m.user?.email ?? '?').slice(0, 2)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-fg">{m.user?.name ?? m.user?.email}</p>
                    <p className="truncate text-xs text-muted">{m.user?.email}</p>
                    <span className="mt-1 inline-block rounded-md bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
                      {formatRoleLabel(m.role)}
                    </span>
                  </div>
                </div>
                {canManageUsers ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex flex-col text-xs font-medium text-muted">
                      Role
                      <select
                        className="mt-1 rounded-lg border border-border bg-surface-2 px-2 py-2 text-xs text-fg"
                        value={m.role}
                        onChange={(e) => void onRoleChange(m, e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="text-xs font-medium text-red-400 hover:text-red-300"
                      onClick={() => void onRemove(m)}
                    >
                      Remove
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function formatRoleLabel(role: string): string {
  const r = ROLES.find((x) => x.value === role)
  return r?.label ?? role.replace(/^role_/, '')
}

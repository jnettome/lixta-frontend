/** Human-readable due line for board task lists / detail (avoids raw ISO). */
export function formatBoardDueAt(iso: string | null | undefined, locale?: string): string {
  if (!iso?.trim()) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.trim()
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return d.toLocaleString()
  }
}

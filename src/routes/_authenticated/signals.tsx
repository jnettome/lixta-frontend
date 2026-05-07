import { createFileRoute, useNavigate, useRouterState } from '@tanstack/react-router'
import { z } from 'zod'
import { InboxShell } from '@/components/shell/InboxShell'

const signalsSearchSchema = z.object({
  view: z.enum(['split', 'full']).optional(),
})

export type SignalsSearch = {
  view?: 'split' | 'full'
}

const VIEW_PREF_KEY = 'signals-view-pref'

function readViewPref(): 'split' | 'full' {
  try {
    return localStorage.getItem(VIEW_PREF_KEY) === 'full' ? 'full' : 'split'
  } catch {
    return 'split'
  }
}

export const Route = createFileRoute('/_authenticated/signals')({
  validateSearch: (raw): SignalsSearch => {
    const parsed = signalsSearchSchema.safeParse(raw)
    if (!parsed.success) return {}
    if (parsed.data.view === 'full' || parsed.data.view === 'split') {
      return { view: parsed.data.view }
    }
    return {}
  },
  component: SignalsRouteLayout,
})

function SignalsRouteLayout() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const view = search.view ?? readViewPref()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const signalMatch = /^\/signals\/([^/]+)\/?$/.exec(pathname)
  const signalId = signalMatch?.[1]

  const setView = (view: 'split' | 'full') => {
    try {
      localStorage.setItem(VIEW_PREF_KEY, view)
    } catch {
      /* ignore */
    }
    if (signalId) {
      void navigate({
        to: '/signals/$signalId',
        params: { signalId },
        search: { view },
        replace: true,
      })
    } else {
      void navigate({
        to: '/signals',
        search: { view },
        replace: true,
      })
    }
  }

  return (
    <InboxShell signalId={signalId} view={view} onViewChange={setView} />
  )
}

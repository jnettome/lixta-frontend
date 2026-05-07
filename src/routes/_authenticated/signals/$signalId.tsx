import { createFileRoute } from '@tanstack/react-router'
import { SignalDetail } from '@/components/shell/SignalDetail'

export const Route = createFileRoute('/_authenticated/signals/$signalId')({
  component: SignalDetailRoute,
})

function SignalDetailRoute() {
  const { signalId } = Route.useParams()
  return <SignalDetail signalId={signalId} />
}

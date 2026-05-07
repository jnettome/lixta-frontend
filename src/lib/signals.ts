import { MOCK_SIGNALS, type Signal } from '@/data/mockSignals'

export function getSignal(id: string): Signal | undefined {
  return MOCK_SIGNALS.find((s) => s.id === id)
}

export function listSignals(): Signal[] {
  return MOCK_SIGNALS
}

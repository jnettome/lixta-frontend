export type SignalStatus = 'READY' | 'QUEUED' | 'WARNING' | 'RUNNING'

export type Signal = {
  id: string
  title: string
  status: SignalStatus
  dateLabel: string
  wave: string
  snippet: string
  body: string
  tags: string[]
  occurrences: number
  affectedUsers: number
}

const mk = (
  i: number,
  partial: Partial<Omit<Signal, 'id'>> & Pick<Signal, 'title' | 'status'>,
): Signal => ({
  id: `sig-${i}`,
  dateLabel: ['Mar 29', 'Mar 28', 'Mar 27', 'Mar 26'][i % 4]!,
  wave: `w:26.${(i % 40) + 1}`,
  snippet:
    'Research is still running on this cluster. Review the latest segment overlap and session replay samples before promoting.',
  body: `This signal surfaces unusual session clustering around checkout abandonment. The pipeline has correlated ${(i % 9) + 2} cohorts with elevated error rates on the payment step. Use the tags below to jump into analytics or open a task when you are ready to act.

We recommend validating against the last seven days of traffic and confirming whether the spike is isolated to a single browser family or geo region. If the pattern holds, create a task and assign it to the owning squad.`,
  tags:
    i % 3 === 0
      ? ['session_replay', 'session_segment_cluster']
      : i % 3 === 1
        ? ['funnel_drop', 'checkout']
        : ['api_latency', 'edge_cache'],
  occurrences: (i % 50) + 3,
  affectedUsers: i % 7 === 0 ? (i % 120) + 1 : 0,
  ...partial,
})

export const MOCK_SIGNALS: Signal[] = [
  mk(1, { title: 'Checkout funnel regression in EU region', status: 'READY' }),
  mk(2, { title: 'Spike in JS errors on pricing page', status: 'QUEUED' }),
  mk(3, { title: 'Session replay: rage clicks on invoice form', status: 'WARNING' }),
  mk(4, { title: 'API 5xx burst on /v1/billing', status: 'RUNNING' }),
  mk(5, { title: 'Mobile Safari memory warnings', status: 'READY' }),
  mk(6, { title: 'Feature flag evaluation latency', status: 'QUEUED' }),
  mk(7, { title: 'Auth refresh token churn', status: 'READY' }),
  mk(8, { title: 'Search index drift on docs site', status: 'WARNING' }),
  mk(9, { title: 'Web vitals CLS regression', status: 'READY' }),
  mk(10, { title: 'Experiment exposure imbalance', status: 'QUEUED' }),
  mk(11, { title: 'CDN cache miss rate elevated', status: 'RUNNING' }),
  mk(12, { title: 'Webhook delivery retries climbing', status: 'READY' }),
  mk(13, { title: 'Postgres slow queries on insights', status: 'WARNING' }),
  mk(14, { title: 'Kafka consumer lag on events topic', status: 'QUEUED' }),
  mk(15, { title: 'GraphQL resolver N+1 pattern', status: 'READY' }),
  mk(16, { title: 'SAML IdP metadata expiry approaching', status: 'WARNING' }),
  mk(17, { title: 'Edge worker cold start latency', status: 'READY' }),
  mk(18, { title: 'Source map upload failures', status: 'QUEUED' }),
  mk(19, { title: 'Replay masking gaps on sensitive fields', status: 'READY' }),
  mk(20, { title: 'Background job queue saturation', status: 'RUNNING' }),
  mk(21, { title: 'Third-party script blocking main thread', status: 'WARNING' }),
  mk(22, { title: 'Anomaly in daily active organizations', status: 'READY' }),
  mk(23, { title: 'Cohort sync delay for marketing lists', status: 'QUEUED' }),
  mk(24, { title: 'Rate limit hits on public API', status: 'READY' }),
  mk(25, { title: 'Dashboard widget load waterfall', status: 'WARNING' }),
  mk(26, { title: 'Email digest open rate drop', status: 'QUEUED' }),
  mk(27, { title: 'iFrame embed CSP violations', status: 'READY' }),
  mk(28, { title: 'Data warehouse export backlog', status: 'RUNNING' }),
  mk(29, { title: 'Org property cardinality explosion', status: 'WARNING' }),
  mk(30, { title: 'Client bundle size threshold exceeded', status: 'READY' }),
]

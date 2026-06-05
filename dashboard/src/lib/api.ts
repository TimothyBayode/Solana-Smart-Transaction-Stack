const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) {
    throw new Error(`API error: ${res.statusText}`)
  }
  return res.json()
}

export interface Metrics {
  totalTransactions: number
  totalFailures: number
  successRate: number
  averageConfirmationLatencyMs: number
  averageFinalizationLatencyMs: number
  currentSlot: number
  health: string
}

export interface Transaction {
  signature: string
  status: string
  submittedAt: string
  processedAt: string
  confirmedAt: string
  finalizedAt: string
  submittedSlot: number
  processedSlot: number
  confirmedSlot: number
  finalizedSlot: number
  processedDeltaMs: number
  confirmedDeltaMs: number
  finalizedDeltaMs: number
  tip: number
}

export interface Failure {
  id: string
  signature: string
  failureType: string
  reason: string
  slot: number
  timestamp: string
  recovered: boolean
  recoveryAction: string
}

export interface Decision {
  id: string
  decision: string
  reasoning: string
  confidence: number
  context: Record<string, unknown>
  timestamp: string
}

export interface Bundle {
  id: string
  bundleId: string
  slot: number
  tip: number
  signatures: string[]
  submittedAt: string
  landed: boolean
  landedSlot: number
}

export interface SlotMetric {
  slot: number
  leader: string
  timestamp: string
}

export const api = {
  getStatus: () => fetchApi<{ running: boolean; health: string; currentSlot: number }>('/api/status'),
  getTransactions: () => fetchApi<Transaction[]>('/api/transactions'),
  getFailures: () => fetchApi<Failure[]>('/api/failures'),
  getDecisions: () => fetchApi<Decision[]>('/api/decisions'),
  getBundles: () => fetchApi<Bundle[]>('/api/bundles'),
  getSlots: () => fetchApi<SlotMetric[]>('/api/slots'),
  getMetrics: () => fetchApi<Metrics>('/api/metrics'),
  triggerFaultInjection: () =>
    fetchApi<{ success: boolean; message: string }>('/api/fault-inject/blockhash-expiry'),
}

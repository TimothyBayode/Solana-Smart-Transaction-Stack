export enum TransactionStatus {
  SUBMITTED = 'submitted',
  PROCESSED = 'processed',
  CONFIRMED = 'confirmed',
  FINALIZED = 'finalized',
}

export interface LifecycleRecord {
  signature: string
  status: TransactionStatus

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
  error?: string
}

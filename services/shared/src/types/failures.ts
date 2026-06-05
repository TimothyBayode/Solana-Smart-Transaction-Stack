export enum FailureType {
  BLOCKHASH_EXPIRED = 'BLOCKHASH_EXPIRED',
  COMPUTE_EXCEEDED = 'COMPUTE_EXCEEDED',
  FEE_TOO_LOW = 'FEE_TOO_LOW',
  BUNDLE_FAILED = 'BUNDLE_FAILED',
  UNKNOWN = 'UNKNOWN',
}

export interface FailureRecord {
  id: string
  signature: string
  failureType: FailureType
  reason: string
  slot: number
  timestamp: string
  recovered: boolean
  recoveryAction?: string
}

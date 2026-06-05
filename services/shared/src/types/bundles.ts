export interface BundleRequest {
  transactions: string[]
  tip: number
  tipAccount: string
}

export interface BundleResult {
  bundleId: string
  slot: number
  tip: number
  submittedAt: string
  signatures: string[]
}

export interface BundleSubmission {
  id: string
  bundleId: string
  slot: number
  tip: number
  signatures: string[]
  submittedAt: string
  landed: boolean
  landedSlot?: number
  error?: string
}

export interface TransactionRequest {
  from: string
  to: string
  amount: number
  computeUnits?: number
  priorityFee?: number
}

export interface TransactionResult {
  signature: string
  slot: number
  blockhash: string
}

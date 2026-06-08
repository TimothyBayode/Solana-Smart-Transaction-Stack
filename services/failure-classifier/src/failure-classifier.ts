import {
  logger,
  getFirestore,
  FailureRepository,
  FailureRecord,
  FailureType,
} from '@stack/shared'

export interface FailureInput {
  signature: string
  error: string
  slot: number
}

export class FailureClassifier {
  private failureRepo: FailureRepository

  constructor() {
    const db = getFirestore()
    this.failureRepo = new FailureRepository(db)
  }

  classify(error: string): FailureType {
    const errorLower = error.toLowerCase()

    if (
      errorLower.includes('blockhash') ||
      errorLower.includes('expired') ||
      errorLower.includes('blockhash not found')
    ) {
      return FailureType.BLOCKHASH_EXPIRED
    }

    if (
      errorLower.includes('compute') ||
      errorLower.includes('exceeded') ||
      errorLower.includes('instruction') ||
      errorLower.includes('cu')
    ) {
      return FailureType.COMPUTE_EXCEEDED
    }

    if (
      errorLower.includes('fee') ||
      errorLower.includes('tip') ||
      errorLower.includes('priority') ||
      errorLower.includes('rent')
    ) {
      return FailureType.FEE_TOO_LOW
    }

    if (
      errorLower.includes('bundle') ||
      errorLower.includes('jito') ||
      errorLower.includes('landed')
    ) {
      return FailureType.BUNDLE_FAILED
    }

    return FailureType.UNKNOWN
  }

  async recordFailure(input: FailureInput): Promise<FailureRecord> {
    const failureType = this.classify(input.error)

    const record: FailureRecord = {
      id: `failure_${input.signature}_${Date.now()}`,
      signature: input.signature,
      failureType,
      reason: input.error,
      slot: input.slot,
      timestamp: new Date().toISOString(),
      recovered: false,
    }

    try {
      await this.failureRepo.saveFailure(record)
      logger.info('Failure recorded', {
        signature: input.signature,
        type: failureType,
        slot: input.slot,
      })
    } catch (error) {
      logger.error('Failed to save failure record', {
        signature: input.signature,
        error: String(error),
      })
    }

    return record
  }

  async markRecovered(id: string, recoveryAction: string): Promise<void> {
    await this.failureRepo.markRecovered(id, recoveryAction)
    logger.info('Failure marked as recovered', { id, recoveryAction })
  }

  async getFailureHistory(limit: number = 50): Promise<FailureRecord[]> {
    return this.failureRepo.getAll(limit)
  }

  getRecoverySuggestion(failureType: FailureType): string {
    switch (failureType) {
      case FailureType.BLOCKHASH_EXPIRED:
        return 'Fetch fresh blockhash, rebuild transaction, and resubmit'
      case FailureType.COMPUTE_EXCEEDED:
        return 'Increase compute budget limit and resubmit'
      case FailureType.FEE_TOO_LOW:
        return 'Increase tip and priority fee, then resubmit'
      case FailureType.BUNDLE_FAILED:
        return 'Check bundle structure, verify signatures, and rebuild'
      case FailureType.UNKNOWN:
      default:
        return 'Escalate to manual review - unknown failure type'
    }
  }
}

import {
  VersionedTransaction,
  PublicKey,
} from '@solana/web3.js'
import { config, logger, getFirestore, BundleRepository, BundleSubmission } from '@stack/shared'

interface BundleBuildParams {
  transactions: VersionedTransaction[]
  tip: number
  tipAccount: string
}

interface BundleSubmitResult {
  bundleId: string
  signatures: string[]
}

export class BundleBuilder {
  private bundleRepo: BundleRepository

  constructor() {
    const db = getFirestore()
    this.bundleRepo = new BundleRepository(db)
  }

  async createBundle(params: BundleBuildParams): Promise<{
    bundleId: string
    transactions: VersionedTransaction[]
    tip: number
  }> {
    const { transactions, tip } = params

    const bundleId = `bundle_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    logger.info('Bundle created', {
      bundleId,
      transactionCount: transactions.length,
      tip,
    })

    return {
      bundleId,
      transactions,
      tip,
    }
  }

  async submitBundle(bundle: {
    bundleId: string
    transactions: VersionedTransaction[]
    tip: number
    slot: number
  }): Promise<BundleSubmitResult> {
    const signatures: string[] = bundle.transactions.map(
      (tx) => Buffer.from(tx.signatures[0]).toString('hex').substring(0, 64),
    )

    const submission: BundleSubmission = {
      id: bundle.bundleId,
      bundleId: bundle.bundleId,
      slot: bundle.slot,
      tip: bundle.tip,
      signatures,
      submittedAt: new Date().toISOString(),
      landed: false,
    }

    try {
      await this.bundleRepo.saveBundle(submission)
      logger.info('Bundle submitted', {
        bundleId: bundle.bundleId,
        slot: bundle.slot,
        tip: bundle.tip,
        signatures: signatures.length,
      })
    } catch (error) {
      logger.error('Failed to save bundle submission', { error: String(error) })
    }

    return {
      bundleId: bundle.bundleId,
      signatures,
    }
  }

  async markLanded(bundleId: string, landedSlot: number): Promise<void> {
    await this.bundleRepo.markLanded(bundleId, landedSlot)
    logger.info('Bundle landed', { bundleId, landedSlot })
  }

  async getBundleHistory(limit: number = 50): Promise<BundleSubmission[]> {
    return this.bundleRepo.getAll(limit)
  }
}

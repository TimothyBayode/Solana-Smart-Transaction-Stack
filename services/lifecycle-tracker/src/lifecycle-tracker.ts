import {
  Connection,
  SignatureResult,
  SignatureStatus,
  PublicKey,
} from '@solana/web3.js'
import {
  config,
  logger,
  getFirestore,
  TransactionRepository,
  LifecycleRecord,
  TransactionStatus,
} from '@stack/shared'

export class LifecycleTracker {
  private connection: Connection
  private txRepo: TransactionRepository
  private trackedTransactions: Map<string, LifecycleRecord> = new Map()

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, {
      commitment: config.solana.commitment,
      wsEndpoint: config.solana.wsUrl,
    })
    const db = getFirestore()
    this.txRepo = new TransactionRepository(db)
  }

  async startTracking(
    signature: string,
    slot: number,
    tip: number,
  ): Promise<void> {
    const record: LifecycleRecord = {
      signature,
      status: TransactionStatus.SUBMITTED,
      submittedAt: new Date().toISOString(),
      processedAt: '',
      confirmedAt: '',
      finalizedAt: '',
      submittedSlot: slot,
      processedSlot: 0,
      confirmedSlot: 0,
      finalizedSlot: 0,
      processedDeltaMs: 0,
      confirmedDeltaMs: 0,
      finalizedDeltaMs: 0,
      tip,
    }

    this.trackedTransactions.set(signature, record)

    try {
      await this.txRepo.saveTransaction(record)
      logger.info('Tracking started for transaction', { signature, slot })

      this.subscribeToStatus(signature)
    } catch (error) {
      logger.error('Failed to start tracking', { signature, error: String(error) })
    }
  }

  private async subscribeToStatus(signature: string): Promise<void> {
    try {
      const subscriptionId = this.connection.onSignature(
        signature,
        (result: SignatureResult, context: { slot: number }) => {
          this.handleSignatureResult(signature, result, context)
        },
        'confirmed',
      )

      logger.info('Subscribed to signature status', { signature, subscriptionId })
    } catch (error) {
      logger.error('Failed to subscribe to signature', { signature, error: String(error) })
    }
  }

  private async handleSignatureResult(
    signature: string,
    result: SignatureResult,
    context: { slot: number },
  ): Promise<void> {
    const record = this.trackedTransactions.get(signature)
    if (!record) {
      return
    }

    if (result.err) {
      logger.error('Transaction failed', {
        signature,
        error: JSON.stringify(result.err),
        slot: context.slot,
      })
      record.error = JSON.stringify(result.err)
      return
    }

    record.processedAt = new Date().toISOString()
    record.processedSlot = context.slot
    record.status = TransactionStatus.PROCESSED

    const submittedTime = new Date(record.submittedAt).getTime()
    const processedTime = new Date(record.processedAt).getTime()
    record.processedDeltaMs = processedTime - submittedTime

    try {
      await this.txRepo.updateTransaction(signature, {
        processedAt: record.processedAt,
        processedSlot: record.processedSlot,
        processedDeltaMs: record.processedDeltaMs,
        status: TransactionStatus.PROCESSED,
      })
      logger.info('Transaction processed', {
        signature,
        deltaMs: record.processedDeltaMs,
      })
    } catch (error) {
      logger.error('Failed to update transaction record', { signature, error: String(error) })
    }

    this.watchForConfirmation(signature, record)
  }

  private async watchForConfirmation(
    signature: string,
    record: LifecycleRecord,
  ): Promise<void> {
    try {
      const subscriptionId = this.connection.onSignature(
        signature,
        (result: SignatureResult, context: { slot: number }) => {
          if (!result.err) {
            record.confirmedAt = new Date().toISOString()
            record.confirmedSlot = context.slot
            record.status = TransactionStatus.CONFIRMED

            const confirmedTime = new Date(record.confirmedAt).getTime()
            const submittedTime = new Date(record.submittedAt).getTime()
            record.confirmedDeltaMs = confirmedTime - submittedTime

            this.txRepo
              .updateTransaction(signature, {
                confirmedAt: record.confirmedAt,
                confirmedSlot: record.confirmedSlot,
                confirmedDeltaMs: record.confirmedDeltaMs,
                status: TransactionStatus.CONFIRMED,
              })
              .catch((error) =>
                logger.error('Failed to update confirmation', { signature, error: String(error) }),
              )

            logger.info('Transaction confirmed', {
              signature,
              deltaMs: record.confirmedDeltaMs,
            })
          }
        },
        'finalized',
      )

      subscriptionId
    } catch (error) {
      logger.error('Failed to watch for confirmation', { signature, error: String(error) })
    }
  }

  async pollFinalization(signature: string): Promise<void> {
    const maxAttempts = 100
    let attempt = 0

    const poll = setInterval(async () => {
      attempt++
      if (attempt > maxAttempts) {
        clearInterval(poll)
        return
      }

      try {
        const status = await this.connection.getSignatureStatus(signature)
        if (status?.value?.confirmationStatus === 'finalized') {
          const record = this.trackedTransactions.get(signature)
          if (record && !record.finalizedAt) {
            record.finalizedAt = new Date().toISOString()
            record.finalizedSlot = status.value.slot || 0
            record.status = TransactionStatus.FINALIZED

            const finalizedTime = new Date(record.finalizedAt).getTime()
            const submittedTime = new Date(record.submittedAt).getTime()
            record.finalizedDeltaMs = finalizedTime - submittedTime

            await this.txRepo.updateTransaction(signature, {
              finalizedAt: record.finalizedAt,
              finalizedSlot: record.finalizedSlot,
              finalizedDeltaMs: record.finalizedDeltaMs,
              status: TransactionStatus.FINALIZED,
            })

            logger.info('Transaction finalized', {
              signature,
              deltaMs: record.finalizedDeltaMs,
              slot: record.finalizedSlot,
            })
          }

          clearInterval(poll)
        }
      } catch (error) {
        logger.error('Failed to poll finalization', { signature, error: String(error) })
        clearInterval(poll)
      }
    }, 2000)

    logger.info('Polling for finalization', { signature, interval: 2000 })
  }

  async getTransactionHistory(limit: number = 50): Promise<LifecycleRecord[]> {
    return this.txRepo.getAll(limit)
  }

  getActiveTransactions(): Map<string, LifecycleRecord> {
    return this.trackedTransactions
  }
}

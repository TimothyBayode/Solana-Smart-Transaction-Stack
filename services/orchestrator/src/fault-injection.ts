import { Connection, PublicKey } from '@solana/web3.js'
import { config, logger } from '@stack/shared'

export class FaultInjector {
  private connection: Connection

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, {
      commitment: config.solana.commitment,
    })
  }

  async simulateBlockhashExpiry(): Promise<{
    originalBlockhash: string
    expiredBlockhash: string
    delayMs: number
  }> {
    logger.info('Fault injection: simulating blockhash expiry')

    const { blockhash } = await this.connection.getLatestBlockhash('confirmed')

    const delayMs = 150000
    logger.info('Waiting for blockhash to expire', {
      blockhash,
      delayMs,
    })

    await new Promise((resolve) => setTimeout(resolve, delayMs))

    logger.info('Blockhash should now be expired', {
      blockhash,
      elapsedMs: delayMs,
    })

    return {
      originalBlockhash: blockhash,
      expiredBlockhash: blockhash,
      delayMs,
    }
  }

  async simulateComputeExceeded(): Promise<void> {
    logger.info('Fault injection: simulating compute exceeded')
  }

  async simulateFeeTooLow(): Promise<void> {
    logger.info('Fault injection: simulating fee too low')
  }
}

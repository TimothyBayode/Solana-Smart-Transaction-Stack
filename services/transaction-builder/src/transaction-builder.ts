import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  SystemProgram,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import { config, logger } from '@stack/shared'

export interface BuildTransactionParams {
  from: PublicKey
  to: PublicKey
  amount: number
  computeUnits?: number
  priorityFee?: number
  tipAmount?: number
  tipAccount?: PublicKey
}

export class TransactionBuilder {
  private connection: Connection

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, {
      commitment: config.solana.commitment,
    })
  }

  async createTransaction(params: BuildTransactionParams): Promise<{
    transaction: VersionedTransaction
    blockhash: string
    lastValidBlockHeight: number
  }> {
    const {
      from,
      to,
      amount,
      computeUnits = 200_000,
      priorityFee = 10_000,
      tipAmount = 0,
      tipAccount,
    } = params

    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash(
      'confirmed',
    )

    const instructions = []

    instructions.push(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: computeUnits,
      }),
    )

    instructions.push(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFee,
      }),
    )

    instructions.push(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: to,
        lamports: amount * LAMPORTS_PER_SOL,
      }),
    )

    if (tipAmount > 0 && tipAccount) {
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: from,
          toPubkey: tipAccount,
          lamports: tipAmount,
        }),
      )
    }

    const message = new TransactionMessage({
      payerKey: from,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message()

    const transaction = new VersionedTransaction(message)

    logger.info('Transaction built', {
      from: from.toBase58(),
      to: to.toBase58(),
      amount,
      tipAmount,
      priorityFee,
      blockhash,
    })

    return { transaction, blockhash, lastValidBlockHeight }
  }

  async getFreshBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
    return this.connection.getLatestBlockhash('confirmed')
  }
}

import {
  Connection,
  PublicKey,
} from '@solana/web3.js'
import {
  config,
  logger,
  getFirestore,
  TipDecisionRepository,
  TipRecommendation,
} from '@stack/shared'

const JITO_TIP_ACCOUNT = new PublicKey(
  config.jito.tipAccount || '96gYZGDn1bYYYQ2mcXUjiT4tNwjHGQKTPPJDFTnZNcv7',
)

interface TipData {
  medianTip: number
  averageTip: number
  p90Tip: number
  landingSuccessRate: number
  slot: number
}

export class TipEngine {
  private connection: Connection
  private tipRepo: TipDecisionRepository
  private recentTips: number[] = []
  private recentSuccesses: number = 0
  private recentTotal: number = 0

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, {
      commitment: config.solana.commitment,
    })
    const db = getFirestore()
    this.tipRepo = new TipDecisionRepository(db)
  }

  async start(): Promise<void> {
    logger.info('Starting Tip Engine')
    await this.refreshTipData()
  }

  private async refreshTipData(): Promise<void> {
    try {
      const balance = await this.connection.getBalance(JITO_TIP_ACCOUNT)
      const epochInfo = await this.connection.getEpochInfo()

      logger.info('Jito tip account data', {
        balance,
        slot: epochInfo.absoluteSlot,
      })
    } catch (error) {
      logger.error('Failed to fetch tip account data', { error: String(error) })
    }
  }

  recordLanding(success: boolean): void {
    this.recentTotal++
    if (success) {
      this.recentSuccesses++
    }

    if (this.recentTotal > 100) {
      this.recentTotal = 100
      this.recentSuccesses = Math.max(0, this.recentSuccesses - 1)
    }
  }

  recordTip(tip: number): void {
    this.recentTips.push(tip)
    if (this.recentTips.length > 100) {
      this.recentTips.shift()
    }
  }

  async getTipData(): Promise<TipData> {
    const sorted = [...this.recentTips].sort((a, b) => a - b)
    const len = sorted.length

    const medianTip = len > 0 ? sorted[Math.floor(len / 2)] : 10000
    const averageTip = len > 0
      ? sorted.reduce((a, b) => a + b, 0) / len
      : 10000
    const p90Tip = len > 0
      ? sorted[Math.floor(len * 0.9)]
      : 30000
    const landingSuccessRate = this.recentTotal > 0
      ? this.recentSuccesses / this.recentTotal
      : 0.5

    const epochInfo = await this.connection.getEpochInfo()

    return {
      medianTip,
      averageTip,
      p90Tip,
      landingSuccessRate,
      slot: epochInfo.absoluteSlot,
    }
  }

  async recommendTip(): Promise<TipRecommendation> {
    const data = await this.getTipData()

    let recommendedTip = data.medianTip

    if (data.landingSuccessRate < 0.5 && data.p90Tip > 0) {
      recommendedTip = Math.floor(data.p90Tip * 1.1)
    } else if (data.landingSuccessRate < 0.7) {
      recommendedTip = Math.floor((data.medianTip + data.p90Tip) / 2)
    } else {
      recommendedTip = Math.floor(data.medianTip * 1.2)
    }

    const recommendation: TipRecommendation = {
      id: `tip_${data.slot}_${Date.now()}`,
      medianTip: data.medianTip,
      averageTip: data.averageTip,
      p90Tip: data.p90Tip,
      recommendedTip,
      landingSuccessRate: data.landingSuccessRate,
      slot: data.slot,
      timestamp: new Date().toISOString(),
    }

    try {
      await this.tipRepo.saveTipDecision(recommendation)
      logger.info('Tip recommendation saved', {
        recommended: recommendedTip,
        median: data.medianTip,
        p90: data.p90Tip,
      })
    } catch (error) {
      logger.error('Failed to save tip recommendation', { error: String(error) })
    }

    return recommendation
  }
}

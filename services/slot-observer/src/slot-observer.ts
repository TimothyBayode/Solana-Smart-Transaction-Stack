import {
  Connection,
  SlotInfo,
} from '@solana/web3.js'
import {
  config,
  logger,
  getFirestore,
  SlotRepository,
  SlotMetric,
} from '@stack/shared'
import { YellowstoneClient, SlotUpdate } from './yellowstone-client'

interface SlotMetrics {
  currentSlot: number
  lastUpdateTime: string
  slotHistory: number[]
  health: 'healthy' | 'degraded' | 'down'
}

export class SlotObserver {
  private connection: Connection
  private yellowstone: YellowstoneClient
  private slotRepo: SlotRepository
  private metrics: SlotMetrics = {
    currentSlot: 0,
    lastUpdateTime: '',
    slotHistory: [],
    health: 'down',
  }

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, {
      commitment: config.solana.commitment,
      wsEndpoint: config.solana.wsUrl,
    })
    this.yellowstone = new YellowstoneClient()
    const db = getFirestore()
    this.slotRepo = new SlotRepository(db)
  }

  async start(): Promise<void> {
    logger.info('Starting Slot Observer')

    try {
      await this.yellowstone.connect()
      await this.yellowstone.subscribeSlots((update) => this.handleSlotUpdate(update))
    } catch (error) {
      logger.warn('Yellowstone connection failed, falling back to RPC subscription', {
        error: String(error),
      })
    }

    this.subscribeViaRpc()
    this.startHealthCheck()
  }

  private subscribeViaRpc(): void {
    try {
      this.connection.onSlotChange((slotInfo: SlotInfo) => {
        const update: SlotUpdate = {
          slot: slotInfo.slot,
          parent: slotInfo.parent,
          leader: '',
          timestamp: new Date().toISOString(),
        }
        this.handleSlotUpdate(update)
      })
      logger.info('Subscribed to slots via RPC')
    } catch (error) {
      logger.error('Failed to subscribe via RPC', { error: String(error) })
    }
  }

  private async handleSlotUpdate(update: SlotUpdate): Promise<void> {
    this.metrics.currentSlot = update.slot
    this.metrics.lastUpdateTime = update.timestamp
    this.metrics.slotHistory.push(update.slot)

    this.metrics.health = 'healthy'

    const metric: SlotMetric = {
      slot: update.slot,
      leader: update.leader || 'unknown',
      timestamp: update.timestamp,
    }

    try {
      await this.slotRepo.saveSlotMetric(metric)
      logger.info('Slot update recorded', { slot: update.slot, leader: update.leader })
    } catch (error) {
      logger.error('Failed to save slot metric', {
        slot: update.slot,
        error: String(error),
      })
    }
  }

  private startHealthCheck(): void {
    setInterval(() => {
      const now = Date.now()
      const lastUpdate = new Date(this.metrics.lastUpdateTime).getTime()
      const elapsed = now - lastUpdate

      if (elapsed > 30000) {
        this.metrics.health = 'down'
        logger.warn('Slot observer health degraded - no updates received', {
          elapsedMs: elapsed,
        })
      } else if (elapsed > 10000) {
        this.metrics.health = 'degraded'
      }
    }, 10000)

    logger.info('Health check started', { interval: 10000 })
  }

  getCurrentSlot(): number {
    return this.metrics.currentSlot
  }

  getHealth(): 'healthy' | 'degraded' | 'down' {
    return this.metrics.health
  }

  stop(): void {
    this.yellowstone.disconnect()
  }
}

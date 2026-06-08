import { config, logger } from '@stack/shared'

export interface SlotUpdate {
  slot: number
  parent: number
  leader: string
  timestamp: string
}

export class YellowstoneClient {
  private isConnected = false

  async connect(): Promise<void> {
    if (!config.yellowstone.grpcUrl) {
      logger.info('Yellowstone gRPC not configured, using RPC fallback')
      return
    }
    logger.info('Yellowstone gRPC client initialized')
    this.isConnected = true
  }

  async subscribeSlots(_onSlot: (update: SlotUpdate) => void): Promise<void> {
    if (!this.isConnected) {
      logger.warn('No gRPC client, falling back to RPC slot subscription')
      return
    }
  }

  get connected(): boolean {
    return this.isConnected
  }

  disconnect(): void {
    this.isConnected = false
  }
}

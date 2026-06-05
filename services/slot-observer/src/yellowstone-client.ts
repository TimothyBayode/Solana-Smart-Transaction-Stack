import { Client as GrpcClient, SubscribeRequest } from '@triton-one/yellowstone-grpc'
import { config } from '@stack/shared'
import { logger } from '@stack/shared'

export interface SlotUpdate {
  slot: number
  parent: number
  leader: string
  timestamp: string
}

export class YellowstoneClient {
  private client: GrpcClient | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private baseDelay = 1000
  private isConnected = false

  async connect(): Promise<void> {
    const url = config.yellowstone.grpcUrl
    if (!url) {
      logger.warn('Yellowstone gRPC URL not configured, using RPC polling fallback')
      return
    }

    try {
      const token = config.yellowstone.grpcToken
      const auth = token ? `Bearer ${token}` : undefined

      this.client = new GrpcClient(url, auth, {
        'grpc.max_reconnect_backoff_ms': 30000,
      })

      logger.info('Yellowstone gRPC client connected')
      this.isConnected = true
      this.reconnectAttempts = 0
    } catch (error) {
      logger.error('Failed to connect to Yellowstone gRPC', { error: String(error) })
      throw error
    }
  }

  async subscribeSlots(onSlot: (update: SlotUpdate) => void): Promise<void> {
    if (!this.client) {
      logger.warn('No gRPC client, cannot subscribe to slots')
      return
    }

    const request: SubscribeRequest = {
      slots: {},
      accounts: {},
      transactions: {},
      blocks: {},
      blocksMeta: {},
      entry: {},
      commitment: 1,
      accountsDataSlice: [],
    }

    try {
      const stream = this.client.subscribe()

      stream.on('data', (data) => {
        if (data.slot) {
          const slotUpdate: SlotUpdate = {
            slot: Number(data.slot.slot),
            parent: Number(data.slot.parent),
            leader: data.slot.leader || '',
            timestamp: new Date().toISOString(),
          }
          onSlot(slotUpdate)
        }
      })

      stream.on('error', (error) => {
        logger.error('gRPC stream error', { error: String(error) })
        this.handleDisconnect()
      })

      stream.on('end', () => {
        logger.warn('gRPC stream ended')
        this.handleDisconnect()
      })

      stream.write(request)
    } catch (error) {
      logger.error('Failed to subscribe to slots via gRPC', { error: String(error) })
      throw error
    }
  }

  private handleDisconnect(): void {
    this.isConnected = false
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(
        this.baseDelay * Math.pow(2, this.reconnectAttempts),
        30000,
      )
      this.reconnectAttempts++
      logger.info('Attempting reconnection', {
        attempt: this.reconnectAttempts,
        delay,
      })
      setTimeout(() => this.connect(), delay)
    } else {
      logger.error('Max reconnection attempts reached')
    }
  }

  get connected(): boolean {
    return this.isConnected
  }

  disconnect(): void {
    this.client?.close()
    this.isConnected = false
  }
}

import { Connection, PublicKey, EpochInfo } from '@solana/web3.js'
import { config, logger } from '@stack/shared'
import { LeaderInfo, LeaderWindow } from '@stack/shared'

const JITO_TIP_ACCOUNTS: string[] = [
  '96gYZGDn1bYYYQ2mcXUjiT4tNwjHGQKTPPJDFTnZNcv7',
  'HFqU5x63VTqvQss8hp11i4wVV8bD44PqwucfW4hGz8s6',
  'ADaUMwnnbyAn3xviRikPyWrSoPqvbrttCjR3bUoBprCF',
  'Cw8MC2iYP1LsNoXYC6cUMey8PkQkrzDJthxPKu2jptkq',
  'ADUZkRJH7xuWVCmJTgX3EfZhHYb3E82bBmFGEQiTx9z',
  'DfXwmZ7bVnF6qfZQ6Wsvc7iJzpA9oMrMSLFiGCdmH4tF',
  'B1k4GutJRqTwiQZN72hSJK8bsCdtE2in9b1rNgGJdrP4',
  'GLuLq73rCQkHjR5AG1KAqK8KcmH1cRbA47SM5fPqKk3q',
  'CWuHdtLby7bRNphKAxBzZMDLhfPzSMkH8ZbAEW8R13Fo',
  '7QkPzXdEam4Cq32kG68tHcGBDF7LbBSao3bX3nx1Kixf',
  '5BomvNN7DR5kJ5JxgKjyqY3kKmn7mhbqNbjKHWBwBK1z',
  'DBNBDvbWPu3KLUqkB4f17uN7k7XPpPNdMQf7htRy8xyN',
  '6iE93KEsaU2ZRrYRn7qPJmJoM5Vsm7m5CrjCaiJ7KsUB',
]

export class LeaderDetector {
  private connection: Connection
  private cachedEpochInfo: EpochInfo | null = null
  private cachedSlotLeaders: PublicKey[] = []

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, {
      commitment: config.solana.commitment,
    })
  }

  async start(): Promise<void> {
    logger.info('Starting Leader Detector')
    await this.refreshEpochData()
  }

  private async refreshEpochData(): Promise<void> {
    try {
      this.cachedEpochInfo = await this.connection.getEpochInfo()
      const leaders = await this.connection.getSlotLeaders(
        this.cachedEpochInfo.absoluteSlot,
        432000,
      )
      this.cachedSlotLeaders = leaders
      logger.info('Epoch data refreshed', {
        currentSlot: this.cachedEpochInfo.absoluteSlot,
        leaderCount: leaders.length,
      })
    } catch (error) {
      logger.error('Failed to refresh epoch data', { error: String(error) })
    }
  }

  async getCurrentLeader(): Promise<LeaderInfo | null> {
    try {
      const epochInfo = await this.connection.getEpochInfo()
      const currentSlot = epochInfo.absoluteSlot
      const slotIndex = currentSlot - epochInfo.slotIndex
      const leaders = await this.connection.getSlotLeaders(currentSlot, 1)

      const leader = leaders[0]?.toBase58() || ''

      return {
        slot: currentSlot,
        leader,
        estimatedTime: new Date().toISOString(),
      }
    } catch (error) {
      logger.error('Failed to get current leader', { error: String(error) })
      return null
    }
  }

  async getNextLeaders(count: number = 10): Promise<LeaderInfo[]> {
    try {
      const epochInfo = await this.connection.getEpochInfo()
      const currentSlot = epochInfo.absoluteSlot
      const leaders = await this.connection.getSlotLeaders(currentSlot, count)
      const slotTime = 400

      return leaders.map((pubkey, i) => ({
        slot: currentSlot + i,
        leader: pubkey.toBase58(),
        estimatedTime: new Date(Date.now() + i * slotTime).toISOString(),
      }))
    } catch (error) {
      logger.error('Failed to get next leaders', { error: String(error) })
      return []
    }
  }

  async getLeaderWindow(): Promise<LeaderWindow> {
    try {
      const currentLeader = await this.getCurrentLeader()
      const upcoming = await this.getNextLeaders(40)

      const nextJitoLeader = upcoming.find((l) =>
        JITO_TIP_ACCOUNTS.some((tipAccount) => {
          const knownValidators = [
            'Duf92ZN4kFWkQ2cUfshZ3sWfJPcGJjprG6K4XTGFPiyA',
            'HFqU5x63VTqvQss8hp11i4wVV8bD44PqwucfW4hGz8s6',
            '7pfUsta7BY2zR1LBrGwCpnJhTqMJwx8BLje6CfdmNHMJ',
          ]
          return knownValidators.includes(l.leader)
        }),
      ) || null

      return {
        currentSlot: upcoming[0]?.slot || 0,
        currentLeader: currentLeader?.leader || '',
        upcomingLeaders: upcoming,
        nextJitoLeader,
      }
    } catch (error) {
      logger.error('Failed to get leader window', { error: String(error) })
      throw error
    }
  }

  isJitoLeader(leader: string): boolean {
    return JITO_TIP_ACCOUNTS.some((account) => {
      const knownValidators = [
        'Duf92ZN4kFWkQ2cUfshZ3sWfJPcGJjprG6K4XTGFPiyA',
        'HFqU5x63VTqvQss8hp11i4wVV8bD44PqwucfW4hGz8s6',
        '7pfUsta7BY2zR1LBrGwCpnJhTqMJwx8BLje6CfdmNHMJ',
      ]
      return knownValidators.includes(leader)
    })
  }
}

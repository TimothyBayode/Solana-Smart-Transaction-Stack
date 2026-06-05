import {
  logger,
  AgentContext,
  getFirestore,
  TransactionRepository,
} from '@stack/shared'
import { SlotObserver } from '@stack/slot-observer'
import { LeaderDetector } from '@stack/leader-detector'
import { TipEngine } from '@stack/tip-engine'
import { AIAgent } from '@stack/ai-agent'
import { TransactionBuilder } from '@stack/transaction-builder'
import { BundleBuilder } from '@stack/bundle-builder'
import { LifecycleTracker } from '@stack/lifecycle-tracker'
import { FailureClassifier } from '@stack/failure-classifier'
import { RecoveryEngine } from '@stack/recovery-engine'
import { FaultInjector } from './fault-injection'

export class Orchestrator {
  private slotObserver: SlotObserver
  private leaderDetector: LeaderDetector
  private tipEngine: TipEngine
  private aiAgent: AIAgent
  private txBuilder: TransactionBuilder
  private bundleBuilder: BundleBuilder
  private lifecycleTracker: LifecycleTracker
  private failureClassifier: FailureClassifier
  private recoveryEngine: RecoveryEngine
  private faultInjector: FaultInjector
  private running = false
  private intervalId: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.slotObserver = new SlotObserver()
    this.leaderDetector = new LeaderDetector()
    this.tipEngine = new TipEngine()
    this.aiAgent = new AIAgent()
    this.txBuilder = new TransactionBuilder()
    this.bundleBuilder = new BundleBuilder()
    this.lifecycleTracker = new LifecycleTracker()
    this.failureClassifier = new FailureClassifier()
    this.faultInjector = new FaultInjector()

    this.recoveryEngine = new RecoveryEngine({
      failureClassifier: this.failureClassifier,
      aiAgent: this.aiAgent,
      txBuilder: this.txBuilder,
      bundleBuilder: this.bundleBuilder,
      tipEngine: this.tipEngine,
      lifecycleTracker: this.lifecycleTracker,
    })
  }

  async start(): Promise<void> {
    logger.info('Starting Smart Transaction Stack Orchestrator')

    await this.slotObserver.start()
    await this.leaderDetector.start()
    await this.tipEngine.start()

    this.running = true
    this.startDecisionLoop()

    logger.info('Orchestrator started')
  }

  private startDecisionLoop(): void {
    this.intervalId = setInterval(async () => {
      if (!this.running) return

      try {
        await this.evaluateAndDecide()
      } catch (error) {
        logger.error('Decision loop error', { error: String(error) })
      }
    }, 60000)

    logger.info('Decision loop started', { interval: 60000 })
  }

  private async evaluateAndDecide(): Promise<void> {
    const currentSlot = this.slotObserver.getCurrentSlot()
    const tipData = await this.tipEngine.getTipData()
    const leaderWindow = await this.leaderDetector.getLeaderWindow()

    const context: AgentContext = {
      networkLoad: tipData.landingSuccessRate < 0.5 ? 0.8 : 0.4,
      medianTip: tipData.medianTip,
      p90Tip: tipData.p90Tip,
      recentSuccessRate: tipData.landingSuccessRate,
      currentSlot,
      currentLeader: leaderWindow.currentLeader,
    }

    const decision = await this.aiAgent.decide(context)

    logger.info('Orchestrator decision', {
      decision: decision.decision,
      confidence: decision.confidence,
      slot: currentSlot,
      leader: leaderWindow.currentLeader,
    })

    if (decision.decision === 'SUBMIT') {
      logger.info('Decision: submit bundle', {
        slot: currentSlot,
        tip: tipData.medianTip,
      })
    }
  }

  async testFaultInjection(): Promise<void> {
    logger.info('Starting fault injection test')

    const expiredResult = await this.faultInjector.simulateBlockhashExpiry()

    await this.recoveryEngine.handleFailure(
      'test_signature_fault_injection',
      'BLOCKHASH_EXPIRED: intentionally expired blockhash for test',
      this.slotObserver.getCurrentSlot(),
    )

    logger.info('Fault injection test completed', {
      originalBlockhash: expiredResult.originalBlockhash,
      delayMs: expiredResult.delayMs,
    })
  }

  getStatus() {
    return {
      running: this.running,
      health: this.slotObserver.getHealth(),
      currentSlot: this.slotObserver.getCurrentSlot(),
    }
  }

  stop(): void {
    this.running = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }
    this.slotObserver.stop()
    logger.info('Orchestrator stopped')
  }
}

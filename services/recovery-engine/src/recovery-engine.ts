import {
  FailureClassifier,
  FailureType,
  FailureRecord,
} from '@stack/failure-classifier'
import { AIAgent, getAgentDecision } from '@stack/ai-agent'
import { TransactionBuilder } from '@stack/transaction-builder'
import { BundleBuilder } from '@stack/bundle-builder'
import { TipEngine } from '@stack/tip-engine'
import { LifecycleTracker } from '@stack/lifecycle-tracker'
import {
  AgentContext,
  FailureRecord as FailureRecordType,
  logger,
  getFirestore,
  FailureRepository,
} from '@stack/shared'

export class RecoveryEngine {
  private failureClassifier: FailureClassifier
  private aiAgent: AIAgent
  private txBuilder: TransactionBuilder
  private bundleBuilder: BundleBuilder
  private tipEngine: TipEngine
  private lifecycleTracker: LifecycleTracker
  private failureRepo: FailureRepository

  constructor(
    deps: {
      failureClassifier: FailureClassifier
      aiAgent: AIAgent
      txBuilder: TransactionBuilder
      bundleBuilder: BundleBuilder
      tipEngine: TipEngine
      lifecycleTracker: LifecycleTracker
    },
  ) {
    this.failureClassifier = deps.failureClassifier
    this.aiAgent = deps.aiAgent
    this.txBuilder = deps.txBuilder
    this.bundleBuilder = deps.bundleBuilder
    this.tipEngine = deps.tipEngine
    this.lifecycleTracker = deps.lifecycleTracker
    const db = getFirestore()
    this.failureRepo = new FailureRepository(db)
  }

  async handleFailure(
    signature: string,
    error: string,
    currentSlot: number,
  ): Promise<void> {
    logger.info('Recovery engine handling failure', { signature, error })

    const failureRecord = await this.failureClassifier.recordFailure({
      signature,
      error,
      slot: currentSlot,
    })

    const context: AgentContext = {
      networkLoad: 0.5,
      medianTip: 15000,
      p90Tip: 30000,
      recentSuccessRate: 0.6,
      currentSlot,
      currentLeader: '',
      failureRate: 0.1,
    }

    const decision = await this.aiAgent.decide(context)

    let recoveryAction = ''
    switch (failureRecord.failureType) {
      case FailureType.BLOCKHASH_EXPIRED:
        recoveryAction = await this.recoverBlockhashExpired(signature, decision)
        break
      case FailureType.COMPUTE_EXCEEDED:
        recoveryAction = await this.recoverComputeExceeded(signature, decision)
        break
      case FailureType.FEE_TOO_LOW:
        recoveryAction = await this.recoverFeeTooLow(signature, decision)
        break
      case FailureType.BUNDLE_FAILED:
        recoveryAction = await this.recoverBundleFailed(signature, decision)
        break
      default:
        recoveryAction = `Escalated: ${decision.reasoning}`
        break
    }

    await this.failureClassifier.markRecovered(failureRecord.id, recoveryAction)

    logger.info('Recovery completed', {
      signature,
      failureType: failureRecord.failureType,
      recoveryAction,
      aiDecision: decision.decision,
    })
  }

  private async recoverBlockhashExpired(
    signature: string,
    decision: import('@stack/shared').AgentDecision,
  ): Promise<string> {
    logger.info('Recovering from BLOCKHASH_EXPIRED', {
      signature,
      aiReasoning: decision.reasoning,
    })
    const { blockhash } = await this.txBuilder.getFreshBlockhash()
    return `Fetched fresh blockhash: ${blockhash}. AI suggested: ${decision.reasoning}`
  }

  private async recoverComputeExceeded(
    signature: string,
    decision: import('@stack/shared').AgentDecision,
  ): Promise<string> {
    logger.info('Recovering from COMPUTE_EXCEEDED', {
      signature,
      aiReasoning: decision.reasoning,
    })
    return `Increased compute budget. AI suggested: ${decision.reasoning}`
  }

  private async recoverFeeTooLow(
    signature: string,
    decision: import('@stack/shared').AgentDecision,
  ): Promise<string> {
    logger.info('Recovering from FEE_TOO_LOW', {
      signature,
      aiReasoning: decision.reasoning,
    })
    const tip = await this.tipEngine.recommendTip()
    return `Recalculated tip to ${tip.recommendedTip}. AI suggested: ${decision.reasoning}`
  }

  private async recoverBundleFailed(
    signature: string,
    decision: import('@stack/shared').AgentDecision,
  ): Promise<string> {
    logger.info('Recovering from BUNDLE_FAILED', {
      signature,
      aiReasoning: decision.reasoning,
    })
    return `Rebuilding bundle. AI suggested: ${decision.reasoning}`
  }
}

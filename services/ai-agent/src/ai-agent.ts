import {
  logger,
  getFirestore,
  DecisionRepository,
  AgentDecision,
  AgentContext,
} from '@stack/shared'
import { OpenAIClient } from './openai-client'

export class AIAgent {
  private client: OpenAIClient
  private decisionRepo: DecisionRepository

  constructor() {
    this.client = new OpenAIClient()
    const db = getFirestore()
    this.decisionRepo = new DecisionRepository(db)
  }

  async decide(context: AgentContext): Promise<AgentDecision> {
    logger.info('AI agent evaluating context', {
      networkLoad: context.networkLoad,
      medianTip: context.medianTip,
      successRate: context.recentSuccessRate,
    })

    const response = await this.client.decide(context as unknown as Record<string, unknown>)

    const decision: AgentDecision = {
      id: `decision_${context.currentSlot}_${Date.now()}`,
      decision: response.decision,
      reasoning: response.reasoning,
      confidence: response.confidence,
      context,
      timestamp: new Date().toISOString(),
    }

    try {
      await this.decisionRepo.saveDecision(decision)
      logger.info('AI decision persisted', { id: decision.id })
    } catch (error) {
      logger.error('Failed to persist AI decision', { error: String(error) })
    }

    return decision
  }
}

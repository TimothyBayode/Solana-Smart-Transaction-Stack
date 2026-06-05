import { AIAgent } from './ai-agent'

const agent = new AIAgent()

export async function getAgentDecision(context: Parameters<AIAgent['decide']>[0]) {
  return agent.decide(context)
}

export { AIAgent }

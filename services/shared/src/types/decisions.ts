export interface AgentContext {
  networkLoad: number
  medianTip: number
  p90Tip: number
  recentSuccessRate: number
  currentSlot: number
  currentLeader: string
  failureRate?: number
}

export interface AgentDecision {
  id: string
  decision: string
  reasoning: string
  confidence: number
  context: AgentContext
  timestamp: string
}

export interface TipRecommendation {
  id: string
  medianTip: number
  averageTip: number
  p90Tip: number
  recommendedTip: number
  landingSuccessRate: number
  slot: number
  timestamp: string
}

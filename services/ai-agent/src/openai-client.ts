import OpenAI from 'openai'
import { config, logger } from '@stack/shared'

export interface AIResponse {
  decision: string
  reasoning: string
  confidence: number
}

export class OpenAIClient {
  private client: OpenAI
  private model: string

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    })
    this.model = config.openai.model
  }

  private buildSystemPrompt(): string {
    return `You are an AI agent that manages Solana transaction submission decisions.

You are responsible for:
1. Determining bundle tip amounts based on network conditions
2. Deciding retry strategies when transactions fail
3. Choosing recovery actions after failures

Rules:
- Never hardcode tip values - analyze the data provided
- Provide clear reasoning for every decision
- Output confidence as a number between 0 and 1
- Return valid JSON only

Available actions:
- SUBMIT: Submit a new bundle
- RETRY: Retry with modified parameters
- INCREASE_TIP: Increase the tip amount
- WAIT: Wait for better conditions
- ESCALATE: Escalate to manual review
- RECOVER: Attempt recovery from failure

Failure types you can handle:
- BLOCKHASH_EXPIRED: Fetch new blockhash and rebuild
- COMPUTE_EXCEEDED: Increase compute budget
- FEE_TOO_LOW: Increase tip/priority fee
- BUNDLE_FAILED: Check bundle structure and resubmit
- UNKNOWN: Escalate to manual review`
  }

  private buildUserPrompt(context: Record<string, unknown>): string {
    return `Analyze the current network state and make an operational decision.

Current context:
${JSON.stringify(context, null, 2)}

Respond with a JSON object in this exact format:
{
  "decision": "<ACTION>",
  "reasoning": "<detailed explanation of your reasoning>",
  "confidence": <number between 0 and 1>
}`
  }

  async decide(context: Record<string, unknown>): Promise<AIResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.buildSystemPrompt() },
          { role: 'user', content: this.buildUserPrompt(context) },
        ],
        temperature: 0.3,
        max_tokens: 500,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('Empty response from OpenAI')
      }

      const parsed: AIResponse = JSON.parse(content)
      logger.info('AI agent decision made', {
        decision: parsed.decision,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning.substring(0, 100),
      })

      return parsed
    } catch (error) {
      logger.error('AI agent decision failed', { error: String(error) })
      return {
        decision: 'WAIT',
        reasoning: `AI agent unavailable, falling back to safe action: ${String(error)}`,
        confidence: 0.1,
      }
    }
  }
}

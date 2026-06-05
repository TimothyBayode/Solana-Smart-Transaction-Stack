import { Firestore } from 'firebase-admin/firestore'
import { BaseRepository } from '../repository'
import { AgentDecision } from '../../types/decisions'

export class DecisionRepository extends BaseRepository<AgentDecision> {
  constructor(db: Firestore) {
    super(db, 'agent_decisions')
  }

  async saveDecision(decision: AgentDecision): Promise<void> {
    await this.create(decision.id, decision)
  }
}

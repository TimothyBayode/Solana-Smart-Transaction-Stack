import { Firestore } from 'firebase-admin/firestore'
import { BaseRepository } from '../repository'
import { TipRecommendation } from '../../types/decisions'

export class TipDecisionRepository extends BaseRepository<TipRecommendation> {
  constructor(db: Firestore) {
    super(db, 'tip_decisions')
  }

  async saveTipDecision(recommendation: TipRecommendation): Promise<void> {
    await this.create(recommendation.id, recommendation)
  }
}

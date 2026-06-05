import { Firestore } from 'firebase-admin/firestore'
import { BaseRepository } from '../repository'
import { SlotMetric } from '../../types/slots'

export class SlotRepository extends BaseRepository<SlotMetric> {
  constructor(db: Firestore) {
    super(db, 'slot_metrics')
  }

  async saveSlotMetric(metric: SlotMetric): Promise<void> {
    await this.create(String(metric.slot), metric)
  }
}

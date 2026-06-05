import { Firestore } from 'firebase-admin/firestore'
import { BaseRepository } from '../repository'
import { FailureRecord } from '../../types/failures'

export class FailureRepository extends BaseRepository<FailureRecord> {
  constructor(db: Firestore) {
    super(db, 'failures')
  }

  async saveFailure(record: FailureRecord): Promise<void> {
    await this.create(record.id, record)
  }

  async markRecovered(id: string, recoveryAction: string): Promise<void> {
    await this.update(id, { recovered: true, recoveryAction })
  }
}

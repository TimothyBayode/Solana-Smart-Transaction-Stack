import { Firestore } from 'firebase-admin/firestore'
import { BaseRepository } from '../repository'
import { LifecycleRecord } from '../../types/lifecycle'

export class TransactionRepository extends BaseRepository<LifecycleRecord> {
  constructor(db: Firestore) {
    super(db, 'transactions')
  }

  async saveTransaction(record: LifecycleRecord): Promise<void> {
    await this.create(record.signature, record)
  }

  async updateTransaction(signature: string, data: Partial<LifecycleRecord>): Promise<void> {
    await this.update(signature, data)
  }
}

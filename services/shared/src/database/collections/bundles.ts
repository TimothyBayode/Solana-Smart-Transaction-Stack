import { Firestore } from 'firebase-admin/firestore'
import { BaseRepository } from '../repository'
import { BundleSubmission } from '../../types/bundles'

export class BundleRepository extends BaseRepository<BundleSubmission> {
  constructor(db: Firestore) {
    super(db, 'bundle_submissions')
  }

  async saveBundle(submission: BundleSubmission): Promise<void> {
    await this.create(submission.id, submission)
  }

  async markLanded(id: string, landedSlot: number): Promise<void> {
    await this.update(id, { landed: true, landedSlot })
  }
}

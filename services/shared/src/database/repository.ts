import { Firestore, CollectionReference, DocumentData } from 'firebase-admin/firestore'
import { logger } from '../logger'

export abstract class BaseRepository<T extends DocumentData> {
  protected readonly collection: CollectionReference

  constructor(
    protected readonly db: Firestore,
    protected readonly collectionName: string,
  ) {
    this.collection = db.collection(collectionName)
  }

  async create(id: string, data: T): Promise<void> {
    try {
      await this.collection.doc(id).set(data as DocumentData)
      logger.info(`${this.collectionName}: document created`, { id })
    } catch (error) {
      logger.error(`${this.collectionName}: failed to create document`, {
        id,
        error: String(error),
      })
      throw error
    }
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      await this.collection.doc(id).update(data as DocumentData)
      logger.info(`${this.collectionName}: document updated`, { id })
    } catch (error) {
      logger.error(`${this.collectionName}: failed to update document`, {
        id,
        error: String(error),
      })
      throw error
    }
  }

  async get(id: string): Promise<T | null> {
    try {
      const doc = await this.collection.doc(id).get()
      if (!doc.exists) {
        return null
      }
      return doc.data() as T
    } catch (error) {
      logger.error(`${this.collectionName}: failed to get document`, {
        id,
        error: String(error),
      })
      throw error
    }
  }

  async getAll(limit: number = 100): Promise<T[]> {
    try {
      const snapshot = await this.collection
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get()
      return snapshot.docs.map((doc) => doc.data() as T)
    } catch (error) {
      logger.error(`${this.collectionName}: failed to get all documents`, {
        error: String(error),
      })
      throw error
    }
  }

  async queryByField(field: string, value: string, limit: number = 100): Promise<T[]> {
    try {
      const snapshot = await this.collection
        .where(field, '==', value)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get()
      return snapshot.docs.map((doc) => doc.data() as T)
    } catch (error) {
      logger.error(`${this.collectionName}: failed to query by field`, {
        field,
        value,
        error: String(error),
      })
      throw error
    }
  }
}

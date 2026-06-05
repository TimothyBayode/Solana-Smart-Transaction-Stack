import * as admin from 'firebase-admin'
import { config } from '../config'

let firestore: admin.firestore.Firestore | null = null

export function getFirestore(): admin.firestore.Firestore {
  if (firestore) {
    return firestore
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'),
      }),
    })
  }

  firestore = admin.firestore()
  return firestore
}

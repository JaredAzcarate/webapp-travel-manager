import { adminDb } from '@/lib/firebase-admin';
import {
  ChapelWithId,
  CreateChapelInput,
  UpdateChapelInput,
} from '../models/chapels.model';
import { Timestamp } from 'firebase-admin/firestore';
import { Timestamp as ClientTimestamp } from 'firebase/firestore';

export class ChapelRepositoryServer {
  private collectionName = 'chapels';

  private convertAdminTimestampToClient(adminTimestamp: any): ClientTimestamp {
    if (!adminTimestamp) return adminTimestamp;
    if (adminTimestamp.toDate) {
      return ClientTimestamp.fromDate(adminTimestamp.toDate());
    }
    return adminTimestamp;
  }

  async getById(id: string): Promise<ChapelWithId> {
    const docRef = adminDb.collection(this.collectionName).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error(`Chapel with id ${id} not found`);
    }

    const data = docSnap.data()!;
    return {
      id: docSnap.id,
      ...data,
      createdAt: this.convertAdminTimestampToClient(data.createdAt),
      updatedAt: this.convertAdminTimestampToClient(data.updatedAt),
    } as ChapelWithId;
  }

  async getAll(): Promise<ChapelWithId[]> {
    const snapshot = await adminDb.collection(this.collectionName).get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: this.convertAdminTimestampToClient(data.createdAt),
        updatedAt: this.convertAdminTimestampToClient(data.updatedAt),
      };
    }) as ChapelWithId[];
  }

  async create(input: CreateChapelInput): Promise<ChapelWithId> {
    const now = Timestamp.now();
    const docRef = await adminDb.collection(this.collectionName).add({
      ...input,
      createdAt: now,
      updatedAt: now,
    });

    const docSnap = await docRef.get();
    const data = docSnap.data()!;
    return {
      id: docSnap.id,
      ...data,
      createdAt: this.convertAdminTimestampToClient(data.createdAt),
      updatedAt: this.convertAdminTimestampToClient(data.updatedAt),
    } as ChapelWithId;
  }

  async update(id: string, input: UpdateChapelInput): Promise<ChapelWithId> {
    const now = Timestamp.now();
    await adminDb.collection(this.collectionName).doc(id).update({
      ...input,
      updatedAt: now,
    });

    return this.getById(id);
  }

  async delete(id: string): Promise<void> {
    await adminDb.collection(this.collectionName).doc(id).delete();
  }
}

export const chapelRepositoryServer = new ChapelRepositoryServer();

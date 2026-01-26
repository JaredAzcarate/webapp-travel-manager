import { adminDb } from '@/lib/firebase-admin';
import { OrdinanceWithId, CreateOrdinanceInput, UpdateOrdinanceInput } from '../models/ordinances.model';
import { Timestamp } from 'firebase-admin/firestore';
import { Timestamp as ClientTimestamp } from 'firebase/firestore';

export class OrdinanceRepositoryServer {
  private collectionName = 'ordinances';

  private convertAdminTimestampToClient(adminTimestamp: any): ClientTimestamp {
    if (!adminTimestamp) return adminTimestamp;
    if (adminTimestamp.toDate) {
      return ClientTimestamp.fromDate(adminTimestamp.toDate());
    }
    return adminTimestamp;
  }

  async getAll(): Promise<OrdinanceWithId[]> {
    const snapshot = await adminDb.collection(this.collectionName).get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as OrdinanceWithId[];
  }

  async getById(id: string): Promise<OrdinanceWithId | null> {
    const docRef = adminDb.collection(this.collectionName).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as OrdinanceWithId;
  }

  async create(input: CreateOrdinanceInput): Promise<OrdinanceWithId> {
    const now = Timestamp.now();
    const docRef = await adminDb.collection(this.collectionName).add({
      ...input,
      createdAt: now,
      updatedAt: now,
    });

    const docSnap = await docRef.get();
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as OrdinanceWithId;
  }

  async update(id: string, input: UpdateOrdinanceInput): Promise<OrdinanceWithId> {
    const now = Timestamp.now();
    await adminDb.collection(this.collectionName).doc(id).update({
      ...input,
      updatedAt: now,
    });

    const result = await this.getById(id);
    if (!result) {
      throw new Error(`Ordinance with id ${id} not found`);
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    await adminDb.collection(this.collectionName).doc(id).delete();
  }
}

export const ordinanceRepositoryServer = new OrdinanceRepositoryServer();

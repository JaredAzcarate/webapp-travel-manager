import { adminDb } from '@/lib/firebase-admin';
import { BusWithId, CreateBusInput, UpdateBusInput } from '../models/buses.model';
import { Timestamp } from 'firebase-admin/firestore';
import { Timestamp as ClientTimestamp } from 'firebase/firestore';

export class BusRepositoryServer {
  private collectionName = 'buses';

  private convertAdminTimestampToClient(adminTimestamp: any): ClientTimestamp {
    if (!adminTimestamp) return adminTimestamp;
    if (adminTimestamp.toDate) {
      return ClientTimestamp.fromDate(adminTimestamp.toDate());
    }
    return adminTimestamp;
  }

  async getAll(): Promise<BusWithId[]> {
    const snapshot = await adminDb.collection(this.collectionName).get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: this.convertAdminTimestampToClient(data.createdAt),
        updatedAt: this.convertAdminTimestampToClient(data.updatedAt),
      };
    }) as BusWithId[];
  }

  async getById(id: string): Promise<BusWithId> {
    const docRef = adminDb.collection(this.collectionName).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error(`Bus with id ${id} not found`);
    }

    const data = docSnap.data()!;
    return {
      id: docSnap.id,
      ...data,
      createdAt: this.convertAdminTimestampToClient(data.createdAt),
      updatedAt: this.convertAdminTimestampToClient(data.updatedAt),
    } as BusWithId;
  }

  async create(input: CreateBusInput): Promise<BusWithId> {
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
    } as BusWithId;
  }

  async update(id: string, input: UpdateBusInput): Promise<BusWithId> {
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

export const busRepositoryServer = new BusRepositoryServer();

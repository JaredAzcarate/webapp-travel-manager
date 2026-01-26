import { adminDb } from '@/lib/firebase-admin';
import { BusStopWithId, CreateBusStopInput, UpdateBusStopInput } from '../models/busStops.model';
import { Timestamp } from 'firebase-admin/firestore';
import { Timestamp as ClientTimestamp } from 'firebase/firestore';

export class BusStopRepositoryServer {
  private collectionName = 'busStops';

  private convertAdminTimestampToClient(adminTimestamp: any): ClientTimestamp {
    if (!adminTimestamp) return adminTimestamp;
    if (adminTimestamp.toDate) {
      return ClientTimestamp.fromDate(adminTimestamp.toDate());
    }
    return adminTimestamp;
  }

  async getAll(): Promise<BusStopWithId[]> {
    const snapshot = await adminDb.collection(this.collectionName).get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: this.convertAdminTimestampToClient(data.createdAt),
        updatedAt: this.convertAdminTimestampToClient(data.updatedAt),
      };
    }) as BusStopWithId[];
  }

  async getById(id: string): Promise<BusStopWithId> {
    const docRef = adminDb.collection(this.collectionName).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error(`BusStop with id ${id} not found`);
    }

    const data = docSnap.data()!;
    return {
      id: docSnap.id,
      ...data,
      createdAt: this.convertAdminTimestampToClient(data.createdAt),
      updatedAt: this.convertAdminTimestampToClient(data.updatedAt),
    } as BusStopWithId;
  }

  async create(input: CreateBusStopInput): Promise<BusStopWithId> {
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
    } as BusStopWithId;
  }

  async update(id: string, input: UpdateBusStopInput): Promise<BusStopWithId> {
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

  async getByBusId(busId: string): Promise<BusStopWithId[]> {
    const snapshot = await adminDb
      .collection(this.collectionName)
      .where('busId', '==', busId)
      .get();

    const stops = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: this.convertAdminTimestampToClient(data.createdAt),
        updatedAt: this.convertAdminTimestampToClient(data.updatedAt),
      };
    }) as BusStopWithId[];

    return stops.sort((a, b) => (a.order || 0) - (b.order || 0));
  }
}

export const busStopRepositoryServer = new BusStopRepositoryServer();

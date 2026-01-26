import { adminDb } from '@/lib/firebase-admin';
import { CaravanWithId, CreateCaravanInput, UpdateCaravanInput } from '../models/caravans.model';
import { Timestamp } from 'firebase-admin/firestore';
import { Timestamp as ClientTimestamp } from 'firebase/firestore';
import { ordinanceRepositoryServer } from '@/features/ordinances/repositories/ordinances.repository.server';

export class CaravanRepositoryServer {
  private collectionName = 'caravans';

  private convertAdminTimestampToClient(adminTimestamp: any): ClientTimestamp | undefined {
    if (!adminTimestamp) return undefined;
    if (adminTimestamp.toDate) {
      return ClientTimestamp.fromDate(adminTimestamp.toDate());
    }
    return adminTimestamp;
  }

  async getAll(): Promise<CaravanWithId[]> {
    const snapshot = await adminDb.collection(this.collectionName).get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        departureAt: this.convertAdminTimestampToClient(data.departureAt),
        returnAt: this.convertAdminTimestampToClient(data.returnAt),
        formOpenAt: this.convertAdminTimestampToClient(data.formOpenAt),
        formCloseAt: this.convertAdminTimestampToClient(data.formCloseAt),
        createdAt: this.convertAdminTimestampToClient(data.createdAt),
        updatedAt: this.convertAdminTimestampToClient(data.updatedAt),
      };
    }) as CaravanWithId[];
  }

  async getById(id: string): Promise<CaravanWithId> {
    const docRef = adminDb.collection(this.collectionName).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error(`Caravan with id ${id} not found`);
    }

    const data = docSnap.data()!;
    return {
      id: docSnap.id,
      ...data,
      departureAt: this.convertAdminTimestampToClient(data.departureAt),
      returnAt: this.convertAdminTimestampToClient(data.returnAt),
      formOpenAt: this.convertAdminTimestampToClient(data.formOpenAt),
      formCloseAt: this.convertAdminTimestampToClient(data.formCloseAt),
      createdAt: this.convertAdminTimestampToClient(data.createdAt),
      updatedAt: this.convertAdminTimestampToClient(data.updatedAt),
    } as CaravanWithId;
  }

  async create(input: CreateCaravanInput): Promise<CaravanWithId> {
    const now = Timestamp.now();

    // Read ordinances from collection and transform to capacity limits
    const ordinances = await ordinanceRepositoryServer.getAll();
    const ordinanceCapacityLimits: CaravanWithId["ordinanceCapacityLimits"] = {};
    const initialCounts: CaravanWithId["ordinanceCapacityCounts"] = {};

    if (ordinances.length > 0) {
      for (const ordinance of ordinances) {
        const ordinanceId = ordinance.id;

        if (!ordinanceCapacityLimits[ordinanceId]) {
          ordinanceCapacityLimits[ordinanceId] = {};
        }
        if (!initialCounts[ordinanceId]) {
          initialCounts[ordinanceId] = {};
        }

        if (ordinance.sessions && Array.isArray(ordinance.sessions)) {
          const hasGenderSpecificSessions = ordinance.sessions.some(
            (s) => s.gender === "M" || s.gender === "F"
          );

          if (hasGenderSpecificSessions) {
            const slotMap = new Map<string, { M?: number; F?: number }>();

            for (const session of ordinance.sessions) {
              if (session && session.slot && session.maxCapacity !== undefined) {
                if (!slotMap.has(session.slot)) {
                  slotMap.set(session.slot, {});
                }
                const slotData = slotMap.get(session.slot)!;

                if (session.gender === "M") {
                  slotData.M = (slotData.M || 0) + session.maxCapacity;
                } else if (session.gender === "F") {
                  slotData.F = (slotData.F || 0) + session.maxCapacity;
                } else {
                  slotData.M = (slotData.M || 0) + session.maxCapacity;
                  slotData.F = (slotData.F || 0) + session.maxCapacity;
                }
              }
            }

            for (const [slot, capacities] of slotMap.entries()) {
              ordinanceCapacityLimits[ordinanceId]![slot] = {
                M: capacities.M || 0,
                F: capacities.F || 0,
              };
              initialCounts[ordinanceId]![slot] = { M: 0, F: 0 };
            }
          } else {
            const slotMap = new Map<string, number>();

            for (const session of ordinance.sessions) {
              if (session && session.slot && session.maxCapacity !== undefined) {
                const current = slotMap.get(session.slot) || 0;
                slotMap.set(session.slot, current + session.maxCapacity);
              }
            }

            for (const [slot, capacity] of slotMap.entries()) {
              ordinanceCapacityLimits[ordinanceId]![slot] = capacity;
              initialCounts[ordinanceId]![slot] = 0;
            }
          }
        }
      }
    }

    const { ordinanceCapacityLimits: _, ...inputWithoutLimits } = input;

    const dataToSave: any = {
      ...inputWithoutLimits,
      createdAt: now,
      updatedAt: now,
    };

    if (Object.keys(ordinanceCapacityLimits).length > 0) {
      dataToSave.ordinanceCapacityLimits = ordinanceCapacityLimits;
    }
    if (Object.keys(initialCounts).length > 0) {
      dataToSave.ordinanceCapacityCounts = initialCounts;
    }

    const docRef = await adminDb.collection(this.collectionName).add(dataToSave);
    const docSnap = await docRef.get();
    const data = docSnap.data()!;

    return {
      id: docSnap.id,
      ...data,
      departureAt: this.convertAdminTimestampToClient(data.departureAt),
      returnAt: this.convertAdminTimestampToClient(data.returnAt),
      formOpenAt: this.convertAdminTimestampToClient(data.formOpenAt),
      formCloseAt: this.convertAdminTimestampToClient(data.formCloseAt),
      createdAt: this.convertAdminTimestampToClient(data.createdAt),
      updatedAt: this.convertAdminTimestampToClient(data.updatedAt),
    } as CaravanWithId;
  }

  async update(id: string, input: UpdateCaravanInput): Promise<CaravanWithId> {
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

export const caravanRepositoryServer = new CaravanRepositoryServer();

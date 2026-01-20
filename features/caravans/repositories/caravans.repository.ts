import { db } from "@/common/lib/firebase";
import { ordinanceRepository } from "@/features/ordinances/repositories/ordinances.repository";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import {
  CaravanWithId,
  CreateCaravanInput,
  UpdateCaravanInput,
} from "../models/caravans.model";

export class CaravanRepository {
  private collectionName = "caravans";

  async getAll(): Promise<CaravanWithId[]> {
    const snap = await getDocs(collection(db, this.collectionName));
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CaravanWithId[];
  }

  async getById(id: string): Promise<CaravanWithId> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`Caravan with id ${id} not found`);
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as CaravanWithId;
  }

  async create(input: CreateCaravanInput): Promise<CaravanWithId> {
    const now = Timestamp.now();

    // Read ordinances from collection and transform to capacity limits
    const ordinances = await ordinanceRepository.getAll();
    const ordinanceCapacityLimits: CaravanWithId["ordinanceCapacityLimits"] =
      {};
    const initialCounts: CaravanWithId["ordinanceCapacityCounts"] = {};

    if (ordinances.length > 0) {
      // Transform Ordinance.sessions into ordinanceCapacityLimits structure
      // Group by ordinance ID
      for (const ordinance of ordinances) {
        const ordinanceId = ordinance.id;

        // Initialize if not exists
        if (!ordinanceCapacityLimits[ordinanceId]) {
          ordinanceCapacityLimits[ordinanceId] = {};
        }
        if (!initialCounts[ordinanceId]) {
          initialCounts[ordinanceId] = {};
        }

        // Add all sessions for this ordinance type
        if (ordinance.sessions && Array.isArray(ordinance.sessions)) {
          // Detect if this ordinance has gender-specific sessions
          const hasGenderSpecificSessions = ordinance.sessions.some(
            (s) => s.gender === "M" || s.gender === "F"
          );

          if (hasGenderSpecificSessions) {
            // Group sessions by slot and gender
            const slotMap = new Map<string, { M?: number; F?: number }>();

            for (const session of ordinance.sessions) {
              if (
                session &&
                session.slot &&
                session.maxCapacity !== undefined
              ) {
                if (!slotMap.has(session.slot)) {
                  slotMap.set(session.slot, {});
                }
                const slotData = slotMap.get(session.slot)!;

                if (session.gender === "M") {
                  slotData.M = (slotData.M || 0) + session.maxCapacity;
                } else if (session.gender === "F") {
                  slotData.F = (slotData.F || 0) + session.maxCapacity;
                } else {
                  // gender is null - add to both
                  slotData.M = (slotData.M || 0) + session.maxCapacity;
                  slotData.F = (slotData.F || 0) + session.maxCapacity;
                }
              }
            }

            // Convert to final structure
            for (const [slot, capacities] of slotMap.entries()) {
              ordinanceCapacityLimits[ordinanceId]![slot] = {
                M: capacities.M || 0,
                F: capacities.F || 0,
              };
              initialCounts[ordinanceId]![slot] = { M: 0, F: 0 };
            }
          } else {
            // All sessions are mixed (gender: null) - sum capacities per slot
            const slotMap = new Map<string, number>();

            for (const session of ordinance.sessions) {
              if (
                session &&
                session.slot &&
                session.maxCapacity !== undefined
              ) {
                const current = slotMap.get(session.slot) || 0;
                slotMap.set(session.slot, current + session.maxCapacity);
              }
            }

            // Convert to final structure
            for (const [slot, capacity] of slotMap.entries()) {
              ordinanceCapacityLimits[ordinanceId]![slot] = capacity;
              initialCounts[ordinanceId]![slot] = 0;
            }
          }
        }
      }
    }

    // Remove ordinanceCapacityLimits from input if it was provided (we use templates instead)
    const { ordinanceCapacityLimits: _, ...inputWithoutLimits } = input;

    const dataToSave: any = {
      ...inputWithoutLimits,
      createdAt: now,
      updatedAt: now,
    };

    // Only add if we have data
    if (Object.keys(ordinanceCapacityLimits).length > 0) {
      dataToSave.ordinanceCapacityLimits = ordinanceCapacityLimits;
    }
    if (Object.keys(initialCounts).length > 0) {
      dataToSave.ordinanceCapacityCounts = initialCounts;
    }

    const docRef = await addDoc(
      collection(db, this.collectionName),
      dataToSave
    );

    const createdDoc = await getDoc(docRef);
    return {
      id: createdDoc.id,
      ...createdDoc.data(),
    } as CaravanWithId;
  }

  async update(id: string, input: UpdateCaravanInput): Promise<CaravanWithId> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...input,
      updatedAt: Timestamp.now(),
    });

    return this.getById(id);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async getActive(): Promise<CaravanWithId[]> {
    const now = Timestamp.now();
    const allCaravans = await this.getAll();

    // Filter caravans where current time is between formOpenAt and formCloseAt
    return allCaravans.filter((caravan) => {
      const formOpenAt = caravan.formOpenAt;
      const formCloseAt = caravan.formCloseAt;

      if (!formOpenAt || !formCloseAt) return false;

      const nowMillis = now.toMillis();
      const openMillis = formOpenAt.toMillis();
      const closeMillis = formCloseAt.toMillis();

      return nowMillis >= openMillis && nowMillis <= closeMillis;
    });
  }

  async updateCapacityCounts(
    id: string,
    counts: CaravanWithId["ordinanceCapacityCounts"]
  ): Promise<CaravanWithId> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ordinanceCapacityCounts: counts,
      updatedAt: Timestamp.now(),
    });

    return this.getById(id);
  }
}

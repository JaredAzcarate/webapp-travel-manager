import { db } from "@/common/lib/firebase";
import { BusRepository } from "@/features/buses/repositories/buses.repository";
import { CaravanRepository } from "@/features/caravans/repositories/caravans.repository";
import {
  decrementCountByGender,
  getCountForGender,
  getLimitForGender,
  incrementCountByGender,
  isGenderSpecificLimit,
  type CapacityValue,
} from "@/features/caravans/utils/ordinanceCapacity.utils";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  CreateRegistrationInput,
  ParticipationStatus,
  RegistrationWithId,
  UpdateRegistrationInput,
} from "../models/registrations.model";

export class RegistrationRepository {
  private collectionName = "registrations";
  private caravanRepository = new CaravanRepository();
  private busRepository = new BusRepository();

  async getAll(): Promise<RegistrationWithId[]> {
    const snap = await getDocs(collection(db, this.collectionName));
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RegistrationWithId[];
  }

  async getById(id: string): Promise<RegistrationWithId> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`Registration with id ${id} not found`);
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as RegistrationWithId;
  }

  async create(input: CreateRegistrationInput): Promise<RegistrationWithId> {
    // Check bus capacity before transaction (optimistic check)
    let isBusFull = false;
    if (input.busId) {
      try {
        const bus = await this.busRepository.getById(input.busId);
        const activeCount = await this.countActiveByBus(
          input.caravanId,
          input.busId
        );
        isBusFull = activeCount >= bus.capacity;
      } catch (error) {
        throw new Error(`Error checking bus capacity: ${error}`);
      }
    }

    // Determine participation status
    const participationStatus: ParticipationStatus = isBusFull
      ? "WAITLIST"
      : input.participationStatus || "ACTIVE";

    return runTransaction(db, async (transaction) => {
      // Verify bus exists
      if (input.busId) {
        const busRef = doc(db, "buses", input.busId);
        const busSnap = await transaction.get(busRef);

        if (!busSnap.exists()) {
          throw new Error(`Bus with id ${input.busId} not found`);
        }
      }

      const caravanRef = doc(db, "caravans", input.caravanId);
      const caravanSnap = await transaction.get(caravanRef);

      if (!caravanSnap.exists()) {
        throw new Error(`Caravan with id ${input.caravanId} not found`);
      }

      const caravan = { id: caravanSnap.id, ...caravanSnap.data() } as any;

      // If bus is full, skip ordinance validation and capacity updates
      // If bus has space, validate ordinances as usual
      if (!isBusFull && input.ordinances && input.ordinances.length > 0) {
        const userGender = input.gender;
        for (const ordinance of input.ordinances) {
          const limitValue: CapacityValue | undefined =
            caravan.ordinanceCapacityLimits?.[ordinance.ordinanceId]?.[ordinance.slot];
          const countValue: CapacityValue | undefined =
            caravan.ordinanceCapacityCounts?.[ordinance.ordinanceId]?.[ordinance.slot];

          if (limitValue === undefined || countValue === undefined) {
            throw new Error(
              `Ordenança ${ordinance.ordinanceId} - ${ordinance.slot} não configurada para esta caravana`
            );
          }

          const limit = getLimitForGender(limitValue, userGender);
          const count = getCountForGender(countValue, userGender);

          if (count >= limit) {
            throw new Error(
              `Não há cupos disponíveis para ${ordinance.ordinanceId} - ${ordinance.slot}`
            );
          }
        }
      }

      const now = Timestamp.now();
      const registrationRef = doc(collection(db, this.collectionName));
      transaction.set(registrationRef, {
        ...input,
        participationStatus,
        createdAt: now,
        updatedAt: now,
      });

      // Only increment ordinance capacity counts if bus is not full
      if (!isBusFull && input.ordinances && input.ordinances.length > 0) {
        const userGender = input.gender;
        const updatedCounts = { ...(caravan.ordinanceCapacityCounts || {}) };

        for (const ordinance of input.ordinances) {
          if (!updatedCounts[ordinance.ordinanceId]) {
            updatedCounts[ordinance.ordinanceId] = {};
          }

          const currentCount = updatedCounts[ordinance.ordinanceId][ordinance.slot];
          const currentLimit =
            caravan.ordinanceCapacityLimits?.[ordinance.ordinanceId]?.[ordinance.slot];

          // Initialize if doesn't exist
          if (currentCount === undefined) {
            if (isGenderSpecificLimit(currentLimit as CapacityValue)) {
              updatedCounts[ordinance.ordinanceId][ordinance.slot] = { M: 0, F: 0 };
            } else {
              updatedCounts[ordinance.ordinanceId][ordinance.slot] = 0;
            }
          }

          // Increment based on structure
          const slotCounts = updatedCounts[ordinance.ordinanceId] as Record<
            string,
            CapacityValue
          >;
          incrementCountByGender(slotCounts, ordinance.slot, userGender);
        }

        transaction.update(caravanRef, {
          ordinanceCapacityCounts: updatedCounts,
          updatedAt: now,
        });
      }

      const createdDoc = await getDoc(registrationRef);
      return {
        id: createdDoc.id,
        ...createdDoc.data(),
      } as RegistrationWithId;
    });
  }

  async update(
    id: string,
    input: UpdateRegistrationInput
  ): Promise<RegistrationWithId> {
    return runTransaction(db, async (transaction) => {
      const registrationRef = doc(db, this.collectionName, id);
      const registrationSnap = await transaction.get(registrationRef);

      if (!registrationSnap.exists()) {
        throw new Error(`Registration with id ${id} not found`);
      }

      const existingRegistration = {
        id: registrationSnap.id,
        ...registrationSnap.data(),
      } as RegistrationWithId;

      const oldOrdinances = existingRegistration.ordinances || [];
      const newOrdinances = input.ordinances || [];

      const caravanRef = doc(db, "caravans", existingRegistration.caravanId);
      const caravanSnap = await transaction.get(caravanRef);

      if (!caravanSnap.exists()) {
        throw new Error(
          `Caravan with id ${existingRegistration.caravanId} not found`
        );
      }

      const caravan = { id: caravanSnap.id, ...caravanSnap.data() } as any;

      const userGender = existingRegistration.gender;

      if (newOrdinances.length > 0) {
        for (const ordinance of newOrdinances) {
          const wasInOld = oldOrdinances.some(
            (old) => old.ordinanceId === ordinance.ordinanceId && old.slot === ordinance.slot
          );

          if (!wasInOld) {
            const limitValue: CapacityValue | undefined =
              caravan.ordinanceCapacityLimits?.[ordinance.ordinanceId]?.[
                ordinance.slot
              ];
            const countValue: CapacityValue | undefined =
              caravan.ordinanceCapacityCounts?.[ordinance.ordinanceId]?.[
                ordinance.slot
              ];

            if (limitValue === undefined || countValue === undefined) {
              throw new Error(
                `Ordenança ${ordinance.ordinanceId} - ${ordinance.slot} não configurada para esta caravana`
              );
            }

            const limit = getLimitForGender(limitValue, userGender);
            const count = getCountForGender(countValue, userGender);

            if (count >= limit) {
              throw new Error(
                `Não há cupos disponíveis para ${ordinance.ordinanceId} - ${ordinance.slot}`
              );
            }
          }
        }
      }

      const now = Timestamp.now();
      transaction.update(registrationRef, {
        ...input,
        updatedAt: now,
      });

      const updatedCounts = { ...(caravan.ordinanceCapacityCounts || {}) };

      // Decrement counts for removed ordinances
      for (const oldOrd of oldOrdinances) {
        const isInNew = newOrdinances.some(
          (newOrd) => newOrd.ordinanceId === oldOrd.ordinanceId && newOrd.slot === oldOrd.slot
        );

        if (!isInNew) {
          if (!updatedCounts[oldOrd.ordinanceId]) {
            updatedCounts[oldOrd.ordinanceId] = {};
          }
          const slotCounts = updatedCounts[oldOrd.ordinanceId] as Record<
            string,
            CapacityValue
          >;
          decrementCountByGender(slotCounts, oldOrd.slot, userGender);
        }
      }

      // Increment counts for new ordinances
      for (const newOrd of newOrdinances) {
        const wasInOld = oldOrdinances.some(
          (oldOrd) => oldOrd.ordinanceId === newOrd.ordinanceId && oldOrd.slot === newOrd.slot
        );

        if (!wasInOld) {
          if (!updatedCounts[newOrd.ordinanceId]) {
            updatedCounts[newOrd.ordinanceId] = {};
          }

          const currentCount = updatedCounts[newOrd.ordinanceId][newOrd.slot];
          const currentLimit =
            caravan.ordinanceCapacityLimits?.[newOrd.ordinanceId]?.[newOrd.slot];

          // Initialize if doesn't exist
          if (currentCount === undefined) {
            if (isGenderSpecificLimit(currentLimit as CapacityValue)) {
              updatedCounts[newOrd.ordinanceId][newOrd.slot] = { M: 0, F: 0 };
            } else {
              updatedCounts[newOrd.ordinanceId][newOrd.slot] = 0;
            }
          }

          const slotCounts = updatedCounts[newOrd.ordinanceId] as Record<
            string,
            CapacityValue
          >;
          incrementCountByGender(slotCounts, newOrd.slot, userGender);
        }
      }

      transaction.update(caravanRef, {
        ordinanceCapacityCounts: updatedCounts,
        updatedAt: now,
      });

      const updatedDoc = await getDoc(registrationRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      } as RegistrationWithId;
    });
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async getByPhone(
    phone: string,
    caravanId?: string
  ): Promise<RegistrationWithId[]> {
    const constraints = [where("phone", "==", phone)];
    if (caravanId) {
      constraints.push(where("caravanId", "==", caravanId));
    }
    const q = query(collection(db, this.collectionName), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RegistrationWithId[];
  }

  async getByCaravanId(caravanId: string): Promise<RegistrationWithId[]> {
    const q = query(
      collection(db, this.collectionName),
      where("caravanId", "==", caravanId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RegistrationWithId[];
  }

  async getByChapelId(
    chapelId: string,
    caravanId?: string
  ): Promise<RegistrationWithId[]> {
    const constraints = [where("chapelId", "==", chapelId)];
    if (caravanId) {
      constraints.push(where("caravanId", "==", caravanId));
    }
    const q = query(collection(db, this.collectionName), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RegistrationWithId[];
  }

  async getByBusId(
    busId: string,
    caravanId: string
  ): Promise<RegistrationWithId[]> {
    const q = query(
      collection(db, this.collectionName),
      where("busId", "==", busId),
      where("caravanId", "==", caravanId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RegistrationWithId[];
  }

  async getActiveByBusId(
    busId: string,
    caravanId: string
  ): Promise<RegistrationWithId[]> {
    const q = query(
      collection(db, this.collectionName),
      where("busId", "==", busId),
      where("caravanId", "==", caravanId),
      where("participationStatus", "==", "ACTIVE")
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RegistrationWithId[];
  }

  async getWaitlistByCaravanId(
    caravanId: string
  ): Promise<RegistrationWithId[]> {
    const q = query(
      collection(db, this.collectionName),
      where("caravanId", "==", caravanId),
      where("participationStatus", "==", "WAITLIST")
    );
    const snap = await getDocs(q);
    const registrations = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RegistrationWithId[];

    // Sort by createdAt (first come, first served)
    return registrations.sort((a, b) => {
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return aTime - bTime;
    });
  }

  async getCancelledByBusId(
    busId: string,
    caravanId: string
  ): Promise<RegistrationWithId[]> {
    const q = query(
      collection(db, this.collectionName),
      where("busId", "==", busId),
      where("caravanId", "==", caravanId),
      where("participationStatus", "==", "CANCELLED")
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RegistrationWithId[];
  }

  async countActiveByBus(caravanId: string, busId: string): Promise<number> {
    const q = query(
      collection(db, this.collectionName),
      where("caravanId", "==", caravanId),
      where("busId", "==", busId),
      where("participationStatus", "==", "ACTIVE")
    );
    const snap = await getDocs(q);
    return snap.size;
  }

  async countCancelledByBus(caravanId: string, busId: string): Promise<number> {
    const q = query(
      collection(db, this.collectionName),
      where("caravanId", "==", caravanId),
      where("busId", "==", busId),
      where("participationStatus", "==", "CANCELLED")
    );
    const snap = await getDocs(q);
    return snap.size;
  }

  async checkPhoneUniqueness(
    phone: string,
    caravanId: string
  ): Promise<boolean> {
    const registrations = await this.getByPhone(phone, caravanId);
    return registrations.length === 0;
  }

  async getFiltered(
    caravanId: string,
    filters?: {
      chapelId?: string;
      paymentStatus?: string;
    }
  ): Promise<RegistrationWithId[]> {
    const constraints = [where("caravanId", "==", caravanId)];

    if (filters?.chapelId) {
      constraints.push(where("chapelId", "==", filters.chapelId));
    }

    if (filters?.paymentStatus) {
      constraints.push(where("paymentStatus", "==", filters.paymentStatus));
    }

    const q = query(collection(db, this.collectionName), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RegistrationWithId[];
  }

  async markPaymentAsPaid(id: string): Promise<RegistrationWithId> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      paymentStatus: "PAID",
      userReportedPaymentAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return this.getById(id);
  }

  async cancelRegistration(id: string): Promise<RegistrationWithId> {
    return runTransaction(db, async (transaction) => {
      const registrationRef = doc(db, this.collectionName, id);
      const registrationSnap = await transaction.get(registrationRef);

      if (!registrationSnap.exists()) {
        throw new Error(`Registration with id ${id} not found`);
      }

      const existingRegistration = {
        id: registrationSnap.id,
        ...registrationSnap.data(),
      } as RegistrationWithId;

      if (existingRegistration.participationStatus === "CANCELLED") {
        return existingRegistration;
      }

      // All reads must be done before any writes
      let caravanSnap = null;
      let caravanRef = null;
      if (
        existingRegistration.ordinances &&
        existingRegistration.ordinances.length > 0
      ) {
        caravanRef = doc(db, "caravans", existingRegistration.caravanId);
        caravanSnap = await transaction.get(caravanRef);
      }

      const now = Timestamp.now();

      // Now do all writes
      transaction.update(registrationRef, {
        participationStatus: "CANCELLED",
        cancelledAt: now,
        updatedAt: now,
      });

      if (caravanSnap && caravanSnap.exists() && caravanRef) {
        const caravan = { id: caravanSnap.id, ...caravanSnap.data() } as any;
        const userGender = existingRegistration.gender;
        const updatedCounts = { ...(caravan.ordinanceCapacityCounts || {}) };

        for (const ordinance of existingRegistration.ordinances) {
          if (!updatedCounts[ordinance.ordinanceId]) {
            updatedCounts[ordinance.ordinanceId] = {};
          }
          const slotCounts = updatedCounts[ordinance.ordinanceId] as Record<
            string,
            CapacityValue
          >;
          decrementCountByGender(slotCounts, ordinance.slot, userGender);
        }

        transaction.update(caravanRef, {
          ordinanceCapacityCounts: updatedCounts,
          updatedAt: now,
        });
      }

      // Return updated registration data directly from transaction
      return {
        ...existingRegistration,
        participationStatus: "CANCELLED" as const,
        cancelledAt: now,
        updatedAt: now,
      } as RegistrationWithId;
    });
  }

  async promoteFromWaitlist(id: string): Promise<RegistrationWithId> {
    return runTransaction(db, async (transaction) => {
      const registrationRef = doc(db, this.collectionName, id);
      const registrationSnap = await transaction.get(registrationRef);

      if (!registrationSnap.exists()) {
        throw new Error(`Registration with id ${id} not found`);
      }

      const existingRegistration = {
        id: registrationSnap.id,
        ...registrationSnap.data(),
      } as RegistrationWithId;

      if (existingRegistration.participationStatus !== "WAITLIST") {
        throw new Error("Registration is not in waitlist");
      }

      // Verify bus capacity
      const bus = await this.busRepository.getById(existingRegistration.busId);
      const activeCount = await this.countActiveByBus(
        existingRegistration.caravanId,
        existingRegistration.busId
      );

      if (activeCount >= bus.capacity) {
        throw new Error("Bus is full, cannot promote from waitlist");
      }

      // Get caravan to update ordinance capacity counts
      const caravanRef = doc(db, "caravans", existingRegistration.caravanId);
      const caravanSnap = await transaction.get(caravanRef);

      if (!caravanSnap.exists()) {
        throw new Error(
          `Caravan with id ${existingRegistration.caravanId} not found`
        );
      }

      const caravan = { id: caravanSnap.id, ...caravanSnap.data() } as any;
      const now = Timestamp.now();

      // Update registration to ACTIVE
      transaction.update(registrationRef, {
        participationStatus: "ACTIVE",
        updatedAt: now,
      });

      // Increment ordinance capacity counts if there are ordinances
      if (
        existingRegistration.ordinances &&
        existingRegistration.ordinances.length > 0
      ) {
        const userGender = existingRegistration.gender;
        const updatedCounts = { ...(caravan.ordinanceCapacityCounts || {}) };

        for (const ordinance of existingRegistration.ordinances) {
          if (!updatedCounts[ordinance.ordinanceId]) {
            updatedCounts[ordinance.ordinanceId] = {};
          }

          const currentCount = updatedCounts[ordinance.ordinanceId][ordinance.slot];
          const currentLimit =
            caravan.ordinanceCapacityLimits?.[ordinance.ordinanceId]?.[ordinance.slot];

          // Initialize if doesn't exist
          if (currentCount === undefined) {
            if (isGenderSpecificLimit(currentLimit as CapacityValue)) {
              updatedCounts[ordinance.ordinanceId][ordinance.slot] = { M: 0, F: 0 };
            } else {
              updatedCounts[ordinance.ordinanceId][ordinance.slot] = 0;
            }
          }

          // Increment based on structure
          const slotCounts = updatedCounts[ordinance.ordinanceId] as Record<
            string,
            CapacityValue
          >;
          incrementCountByGender(slotCounts, ordinance.slot, userGender);
        }

        transaction.update(caravanRef, {
          ordinanceCapacityCounts: updatedCounts,
          updatedAt: now,
        });
      }

      const updatedDoc = await getDoc(registrationRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      } as RegistrationWithId;
    });
  }
}

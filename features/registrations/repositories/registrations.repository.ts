import { db } from "@/common/lib/firebase";
import { generateGdprUuid } from "@/common/utils/uuid.utils";
import { BusRepository } from "@/features/buses/repositories/buses.repository";
import { CaravanWithId } from "@/features/caravans/models/caravans.model";
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

  private migrateRegistration(data: unknown): RegistrationWithId {
    const registration = data as Partial<RegistrationWithId> & { id: string };
    
    // Migrate isAdult to ageCategory if needed
    const registrationWithLegacy = registration as Partial<RegistrationWithId> & { id: string; isAdult?: boolean };
    if (registrationWithLegacy.isAdult !== undefined && !registrationWithLegacy.ageCategory) {
      registrationWithLegacy.ageCategory = registrationWithLegacy.isAdult ? "ADULT" : "YOUTH";
    }
    
    // Ensure privacyPolicyAccepted exists (default to false for old records)
    if (registration.privacyPolicyAccepted === undefined) {
      registration.privacyPolicyAccepted = false;
    }
    
    return registration as RegistrationWithId;
  }

  async getAll(): Promise<RegistrationWithId[]> {
    const snap = await getDocs(collection(db, this.collectionName));
    return snap.docs.map((doc) =>
      this.migrateRegistration({
        id: doc.id,
        ...doc.data(),
      })
    );
  }

  async getById(id: string): Promise<RegistrationWithId> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`Registration with id ${id} not found`);
    }

    return this.migrateRegistration({
      id: docSnap.id,
      ...docSnap.data(),
    });
  }

  async create(input: CreateRegistrationInput): Promise<RegistrationWithId> {
    const response = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erro ao criar inscrição");
    }

    const result = await response.json();
    return result.registration;
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

      const caravan = { id: caravanSnap.id, ...caravanSnap.data() } as CaravanWithId;

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
      return this.migrateRegistration({
        id: updatedDoc.id,
        ...updatedDoc.data(),
      });
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
    const params = new URLSearchParams({ phone });
    if (caravanId) {
      params.append("caravanId", caravanId);
    }

    const response = await fetch(`/api/registrations/by-phone?${params.toString()}`);

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erro ao buscar inscrições");
    }

    const result = await response.json();
    return result.registrations;
  }

  async getByPhoneAndName(
    phone: string,
    fullName: string
  ): Promise<RegistrationWithId[]> {
    const q = query(
      collection(db, this.collectionName),
      where("phone", "==", phone)
    );
    const snap = await getDocs(q);
    const allRegistrations = snap.docs.map((doc) =>
      this.migrateRegistration({
        id: doc.id,
        ...doc.data(),
      })
    );
    
    // Filter by fullName (case-insensitive)
    return allRegistrations.filter(
      (reg) => reg.fullName.toLowerCase() === fullName.toLowerCase()
    );
  }

  async getByUuid(uuid: string): Promise<RegistrationWithId | null> {
    const q = query(
      collection(db, this.collectionName),
      where("gdprUuid", "==", uuid)
    );
    const snap = await getDocs(q);
    
    if (snap.empty) {
      return null;
    }
    
    return this.migrateRegistration({
      id: snap.docs[0].id,
      ...snap.docs[0].data(),
    });
  }

  async getByCaravanId(caravanId: string): Promise<RegistrationWithId[]> {
    const q = query(
      collection(db, this.collectionName),
      where("caravanId", "==", caravanId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) =>
      this.migrateRegistration({
        id: doc.id,
        ...doc.data(),
      })
    );
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
    return snap.docs.map((doc) =>
      this.migrateRegistration({
        id: doc.id,
        ...doc.data(),
      })
    );
  }

  async getByBusId(
    busId: string,
    caravanId: string
  ): Promise<RegistrationWithId[]> {
    const params = new URLSearchParams({
      busId,
      caravanId,
    });

    const response = await fetch(
      `/api/registrations/by-bus?${params.toString()}`
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erro ao buscar inscrições");
    }

    const result = await response.json();
    return result.registrations;
  }

  async getActiveByBusId(
    busId: string,
    caravanId: string
  ): Promise<RegistrationWithId[]> {
    const params = new URLSearchParams({
      busId,
      caravanId,
    });

    const response = await fetch(
      `/api/registrations/active/by-bus?${params.toString()}`
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erro ao buscar inscrições ativas");
    }

    const result = await response.json();
    return result.registrations;
  }

  async getWaitlistByCaravanId(
    caravanId: string
  ): Promise<RegistrationWithId[]> {
    const params = new URLSearchParams({
      caravanId,
    });

    const response = await fetch(
      `/api/registrations/waitlist/by-caravan?${params.toString()}`
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erro ao buscar lista de espera");
    }

    const result = await response.json();
    return result.registrations;
  }

  async getCancelledByBusId(
    busId: string,
    caravanId: string
  ): Promise<RegistrationWithId[]> {
    const params = new URLSearchParams({
      busId,
      caravanId,
    });

    const response = await fetch(
      `/api/registrations/cancelled/by-bus?${params.toString()}`
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erro ao buscar inscrições canceladas");
    }

    const result = await response.json();
    return result.registrations;
  }

  async countActiveByBus(caravanId: string, busId: string): Promise<number> {
    const response = await fetch(
      `/api/registrations/count/active?caravanId=${encodeURIComponent(caravanId)}&busId=${encodeURIComponent(busId)}`
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Erro ao contar inscrições ativas");
    }

    const result = await response.json();
    return result.count;
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
    return snap.docs.map((doc) =>
      this.migrateRegistration({
        id: doc.id,
        ...doc.data(),
      })
    );
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
        const caravan = { id: caravanSnap.id, ...caravanSnap.data() } as CaravanWithId;
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

      const caravan = { id: caravanSnap.id, ...caravanSnap.data() } as CaravanWithId;
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

export const registrationRepository = new RegistrationRepository();

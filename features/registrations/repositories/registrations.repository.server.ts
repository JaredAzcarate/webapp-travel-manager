import { adminDb } from '@/lib/firebase-admin';
import {
  CreateRegistrationInput,
  ParticipationStatus,
  RegistrationWithId,
  UpdateRegistrationInput,
} from '../models/registrations.model';
import { Timestamp } from 'firebase-admin/firestore';
import { Timestamp as ClientTimestamp } from 'firebase/firestore';
import { CaravanWithId } from '@/features/caravans/models/caravans.model';
import {
  decrementCountByGender,
  getCountForGender,
  getLimitForGender,
  incrementCountByGender,
  isGenderSpecificLimit,
  type CapacityValue,
} from '@/features/caravans/utils/ordinanceCapacity.utils';
import { busRepositoryServer } from '@/features/buses/repositories/buses.repository.server';
import { caravanRepositoryServer } from '@/features/caravans/repositories/caravans.repository.server';
import { generateGdprUuid } from '@/common/utils/uuid.utils';

export class RegistrationRepositoryServer {
  private collectionName = 'registrations';

  private convertAdminTimestampToClient(adminTimestamp: any): ClientTimestamp {
    if (!adminTimestamp) return adminTimestamp;
    if (adminTimestamp.toDate) {
      return ClientTimestamp.fromDate(adminTimestamp.toDate());
    }
    return adminTimestamp;
  }

  private migrateRegistration(data: unknown): RegistrationWithId {
    const registration = data as Partial<RegistrationWithId> & { id: string };
    
    // Migrate isAdult to ageCategory if needed
    const registrationWithLegacy = registration as Partial<RegistrationWithId> & { id: string; isAdult?: boolean };
    if (registrationWithLegacy.isAdult !== undefined && !registrationWithLegacy.ageCategory) {
      registrationWithLegacy.ageCategory = registrationWithLegacy.isAdult ? 'ADULT' : 'YOUTH';
    }
    
    // Ensure privacyPolicyAccepted exists (default to false for old records)
    if (registration.privacyPolicyAccepted === undefined) {
      registration.privacyPolicyAccepted = false;
    }

    // Convert Admin SDK Timestamps to client Timestamps
    const converted = {
      ...registration,
      createdAt: this.convertAdminTimestampToClient(registration.createdAt),
      updatedAt: this.convertAdminTimestampToClient(registration.updatedAt),
      paymentConfirmedAt: this.convertAdminTimestampToClient(registration.paymentConfirmedAt),
      userReportedPaymentAt: this.convertAdminTimestampToClient(registration.userReportedPaymentAt),
      cancelledAt: this.convertAdminTimestampToClient(registration.cancelledAt),
      privacyPolicyAcceptedAt: this.convertAdminTimestampToClient(registration.privacyPolicyAcceptedAt),
      consentWithdrawnAt: this.convertAdminTimestampToClient(registration.consentWithdrawnAt),
    };
    
    return converted as RegistrationWithId;
  }

  async getByUuid(uuid: string): Promise<RegistrationWithId | null> {
    const snapshot = await adminDb
      .collection(this.collectionName)
      .where('gdprUuid', '==', uuid)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return this.migrateRegistration({
      id: doc.id,
      ...doc.data(),
    });
  }

  async getByPhone(
    phone: string,
    caravanId?: string
  ): Promise<RegistrationWithId[]> {
    let query = adminDb
      .collection(this.collectionName)
      .where('phone', '==', phone);

    if (caravanId) {
      query = query.where('caravanId', '==', caravanId);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) =>
      this.migrateRegistration({
        id: doc.id,
        ...doc.data(),
      })
    );
  }

  async getByPhoneAndName(
    phone: string,
    fullName: string
  ): Promise<RegistrationWithId[]> {
    const snapshot = await adminDb
      .collection(this.collectionName)
      .where('phone', '==', phone)
      .get();

    const allRegistrations = snapshot.docs.map((doc) =>
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

  async getByBusId(
    busId: string,
    caravanId: string
  ): Promise<RegistrationWithId[]> {
    const snapshot = await adminDb
      .collection(this.collectionName)
      .where('busId', '==', busId)
      .where('caravanId', '==', caravanId)
      .get();

    return snapshot.docs.map((doc) =>
      this.migrateRegistration({
        id: doc.id,
        ...doc.data(),
      })
    );
  }

  async getActiveByBusId(
    busId: string,
    caravanId: string
  ): Promise<RegistrationWithId[]> {
    const snapshot = await adminDb
      .collection(this.collectionName)
      .where('busId', '==', busId)
      .where('caravanId', '==', caravanId)
      .where('participationStatus', '==', 'ACTIVE')
      .get();

    return snapshot.docs.map((doc) =>
      this.migrateRegistration({
        id: doc.id,
        ...doc.data(),
      })
    );
  }

  async getCancelledByBusId(
    busId: string,
    caravanId: string
  ): Promise<RegistrationWithId[]> {
    const snapshot = await adminDb
      .collection(this.collectionName)
      .where('busId', '==', busId)
      .where('caravanId', '==', caravanId)
      .where('participationStatus', '==', 'CANCELLED')
      .get();

    return snapshot.docs.map((doc) =>
      this.migrateRegistration({
        id: doc.id,
        ...doc.data(),
      })
    );
  }

  async getWaitlistByCaravanId(
    caravanId: string
  ): Promise<RegistrationWithId[]> {
    const snapshot = await adminDb
      .collection(this.collectionName)
      .where('caravanId', '==', caravanId)
      .where('participationStatus', '==', 'WAITLIST')
      .get();

    const registrations = snapshot.docs.map((doc) =>
      this.migrateRegistration({
        id: doc.id,
        ...doc.data(),
      })
    );

    // Sort by createdAt (oldest first)
    return registrations.sort((a, b) => {
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return aTime - bTime;
    });
  }

  async getFiltered(
    caravanId: string,
    filters?: { chapelId?: string; paymentStatus?: string }
  ): Promise<RegistrationWithId[]> {
    let query = adminDb
      .collection(this.collectionName)
      .where('caravanId', '==', caravanId);

    if (filters?.chapelId) {
      query = query.where('chapelId', '==', filters.chapelId) as any;
    }
    if (filters?.paymentStatus) {
      query = query.where('paymentStatus', '==', filters.paymentStatus) as any;
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) =>
      this.migrateRegistration({
        id: doc.id,
        ...doc.data(),
      })
    );
  }

  async countActiveByBus(
    caravanId: string,
    busId: string
  ): Promise<number> {
    const snapshot = await adminDb
      .collection(this.collectionName)
      .where('caravanId', '==', caravanId)
      .where('busId', '==', busId)
      .where('participationStatus', '==', 'ACTIVE')
      .get();

    return snapshot.size;
  }

  async create(input: CreateRegistrationInput): Promise<RegistrationWithId> {
    // Check bus capacity before transaction (optimistic check)
    let isBusFull = false;
    if (input.busId) {
      try {
        const bus = await busRepositoryServer.getById(input.busId);
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
      ? 'WAITLIST'
      : input.participationStatus || 'ACTIVE';

    // Generate registration ID before transaction
    const registrationRef = adminDb.collection(this.collectionName).doc();
    const registrationId = registrationRef.id;

    await adminDb.runTransaction(async (transaction) => {
      // Verify bus exists
      if (input.busId) {
        const busRef = adminDb.collection('buses').doc(input.busId);
        const busSnap = await transaction.get(busRef);

        if (!busSnap.exists) {
          throw new Error(`Bus with id ${input.busId} not found`);
        }
      }

      const caravanRef = adminDb.collection('caravans').doc(input.caravanId);
      const caravanSnap = await transaction.get(caravanRef);

      if (!caravanSnap.exists) {
        throw new Error(`Caravan with id ${input.caravanId} not found`);
      }

      const caravan = { id: caravanSnap.id, ...caravanSnap.data() } as CaravanWithId;

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
      
      // Generate UUID if not provided
      const gdprUuid = input.gdprUuid || generateGdprUuid();
      
      // Set privacyPolicyAcceptedAt if privacy policy is accepted
      const privacyPolicyAcceptedAt = input.privacyPolicyAccepted
        ? input.privacyPolicyAcceptedAt || now
        : undefined;
      
      transaction.set(registrationRef, {
        ...input,
        gdprUuid,
        privacyPolicyAcceptedAt,
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

      // Return the registration ID so we can fetch it after the transaction
      return registrationId;
    });

    // After transaction completes, fetch the created document
    const createdDoc = await adminDb.collection(this.collectionName).doc(registrationId).get();
    if (!createdDoc.exists) {
      throw new Error('Failed to create registration');
    }
    
    return this.migrateRegistration({
      id: createdDoc.id,
      ...createdDoc.data(),
    });
  }

  async update(
    id: string,
    input: UpdateRegistrationInput
  ): Promise<RegistrationWithId> {
    const now = Timestamp.now();
    
    await adminDb.collection(this.collectionName).doc(id).update({
      ...input,
      updatedAt: now,
    });

    const docRef = adminDb.collection(this.collectionName).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error(`Registration with id ${id} not found`);
    }

    return this.migrateRegistration({
      id: docSnap.id,
      ...docSnap.data(),
    });
  }

  async delete(id: string): Promise<void> {
    await adminDb.collection(this.collectionName).doc(id).delete();
  }

  async markPaymentAsPaid(id: string): Promise<RegistrationWithId> {
    const now = Timestamp.now();
    
    await adminDb.collection(this.collectionName).doc(id).update({
      paymentStatus: 'PAID',
      userReportedPaymentAt: now,
      updatedAt: now,
    });

    const docRef = adminDb.collection(this.collectionName).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error(`Registration with id ${id} not found`);
    }

    return this.migrateRegistration({
      id: docSnap.id,
      ...docSnap.data(),
    });
  }

  async cancelRegistration(id: string): Promise<RegistrationWithId> {
    return adminDb.runTransaction(async (transaction) => {
      const registrationRef = adminDb.collection(this.collectionName).doc(id);
      const registrationSnap = await transaction.get(registrationRef);

      if (!registrationSnap.exists) {
        throw new Error(`Registration with id ${id} not found`);
      }

      const existingRegistration = {
        id: registrationSnap.id,
        ...registrationSnap.data(),
      } as RegistrationWithId;

      if (existingRegistration.participationStatus === 'CANCELLED') {
        return existingRegistration;
      }

      // All reads must be done before any writes
      let caravanSnap = null;
      let caravanRef = null;
      if (
        existingRegistration.ordinances &&
        existingRegistration.ordinances.length > 0
      ) {
        caravanRef = adminDb.collection('caravans').doc(existingRegistration.caravanId);
        caravanSnap = await transaction.get(caravanRef);
      }

      const now = Timestamp.now();

      // Now do all writes
      transaction.update(registrationRef, {
        participationStatus: 'CANCELLED',
        cancelledAt: now,
        updatedAt: now,
      });

      if (caravanSnap && caravanSnap.exists && caravanRef) {
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
        participationStatus: 'CANCELLED' as const,
        cancelledAt: this.convertAdminTimestampToClient(now),
        updatedAt: this.convertAdminTimestampToClient(now),
      } as RegistrationWithId;
    });
  }
}

export const registrationRepositoryServer = new RegistrationRepositoryServer();

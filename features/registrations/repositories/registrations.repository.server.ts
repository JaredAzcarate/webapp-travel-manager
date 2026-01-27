import { adminDb } from '@/lib/firebase-admin';
import {
  RegistrationWithId,
  UpdateRegistrationInput,
} from '../models/registrations.model';
import { Timestamp } from 'firebase-admin/firestore';
import { Timestamp as ClientTimestamp } from 'firebase/firestore';

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
}

export const registrationRepositoryServer = new RegistrationRepositoryServer();

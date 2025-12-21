import { db } from "@/common/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  CreateRegistrationInput,
  RegistrationWithId,
  UpdateRegistrationInput,
} from "../models/registrations.model";

export class RegistrationRepository {
  private collectionName = "registrations";

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
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, this.collectionName), {
      ...input,
      createdAt: now,
      updatedAt: now,
    });

    const createdDoc = await getDoc(docRef);
    return {
      id: createdDoc.id,
      ...createdDoc.data(),
    } as RegistrationWithId;
  }

  async update(
    id: string,
    input: UpdateRegistrationInput
  ): Promise<RegistrationWithId> {
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
}

import { db } from "@/common/lib/firebase";
import { OrdinanceType } from "@/features/registrations/models/registrations.model";
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
  CreateOrdinanceInput,
  OrdinanceSession,
  OrdinanceWithId,
  UpdateOrdinanceInput,
} from "../models/ordinances.model";

export class OrdinanceRepository {
  private collectionName = "ordinances";

  async getAll(): Promise<OrdinanceWithId[]> {
    const snap = await getDocs(collection(db, this.collectionName));
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as OrdinanceWithId[];
  }

  async getById(id: string): Promise<OrdinanceWithId | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as OrdinanceWithId;
  }

  async getByType(type: OrdinanceType): Promise<OrdinanceWithId | null> {
    const q = query(
      collection(db, this.collectionName),
      where("type", "==", type)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return null;
    }

    return {
      id: snap.docs[0].id,
      ...snap.docs[0].data(),
    } as OrdinanceWithId;
  }

  async create(input: CreateOrdinanceInput): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, this.collectionName), {
      ...input,
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  }

  async update(id: string, input: UpdateOrdinanceInput): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...input,
      updatedAt: Timestamp.now(),
    });
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async getSessionByTypeAndSlot(
    type: OrdinanceType,
    slot: string
  ): Promise<OrdinanceSession | null> {
    const ordinance = await this.getByType(type);
    if (!ordinance) {
      return null;
    }

    return ordinance.sessions.find((session) => session.slot === slot) || null;
  }
}

export const ordinanceRepository = new OrdinanceRepository();

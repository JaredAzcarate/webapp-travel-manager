import { db } from "@/common/lib/firebase";
import {
  ChapelWithId,
  CreateChapelInput,
  UpdateChapelInput,
} from "../models/chapels.model";
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

export class ChapelRepository {
  private collectionName = "chapels";

  async getAll(): Promise<ChapelWithId[]> {
    const snap = await getDocs(collection(db, this.collectionName));
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ChapelWithId[];
  }

  async getById(id: string): Promise<ChapelWithId> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`Chapel with id ${id} not found`);
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as ChapelWithId;
  }

  async create(input: CreateChapelInput): Promise<ChapelWithId> {
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
    } as ChapelWithId;
  }

  async update(id: string, input: UpdateChapelInput): Promise<ChapelWithId> {
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
}

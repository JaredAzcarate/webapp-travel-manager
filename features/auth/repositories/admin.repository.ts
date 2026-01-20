import { db } from "@/common/lib/firebase";
import { comparePassword, hashPassword } from "@/lib/auth/password.utils";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { AdminWithId, CreateAdminInput } from "../models/admin.model";

export class AdminRepository {
  private collectionName = "admin";

  async getByUsername(username: string): Promise<AdminWithId | null> {
    const q = query(
      collection(db, this.collectionName),
      where("username", "==", username)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return null;
    }

    const doc = snap.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as AdminWithId;
  }

  async create(input: CreateAdminInput): Promise<AdminWithId> {
    const now = Timestamp.now();
    const hashedPassword = await hashPassword(input.password);

    const docRef = await addDoc(collection(db, this.collectionName), {
      username: input.username,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: docRef.id,
      username: input.username,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    } as AdminWithId;
  }

  async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return comparePassword(plainPassword, hashedPassword);
  }

  async updatePassword(adminId: string, newPassword: string): Promise<void> {
    const hashedPassword = await hashPassword(newPassword);
    const docRef = doc(db, this.collectionName, adminId);
    await updateDoc(docRef, {
      password: hashedPassword,
      updatedAt: Timestamp.now(),
    });
  }
}

export const adminRepository = new AdminRepository();

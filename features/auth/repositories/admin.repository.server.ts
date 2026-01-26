import { adminDb } from '@/lib/firebase-admin';
import { hashPassword } from '@/lib/auth/password.utils';
import { AdminWithId, CreateAdminInput } from '../models/admin.model';
import { Timestamp } from 'firebase-admin/firestore';
import { Timestamp as ClientTimestamp } from 'firebase/firestore';

export class AdminRepositoryServer {
  private collectionName = 'admin';

  private convertAdminTimestampToClient(adminTimestamp: any): ClientTimestamp {
    if (!adminTimestamp) return adminTimestamp;
    if (adminTimestamp.toDate) {
      return ClientTimestamp.fromDate(adminTimestamp.toDate());
    }
    return adminTimestamp;
  }

  async getByUsername(username: string): Promise<AdminWithId | null> {
    const snapshot = await adminDb
      .collection(this.collectionName)
      .where('username', '==', username)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: this.convertAdminTimestampToClient(data.createdAt),
      updatedAt: this.convertAdminTimestampToClient(data.updatedAt),
    } as AdminWithId;
  }

  async create(input: CreateAdminInput): Promise<AdminWithId> {
    const now = Timestamp.now();
    const hashedPassword = await hashPassword(input.password);

    const docRef = await adminDb.collection(this.collectionName).add({
      username: input.username,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: docRef.id,
      username: input.username,
      password: hashedPassword,
      createdAt: this.convertAdminTimestampToClient(now),
      updatedAt: this.convertAdminTimestampToClient(now),
    } as AdminWithId;
  }

  async updatePassword(adminId: string, newPassword: string): Promise<void> {
    const hashedPassword = await hashPassword(newPassword);
    await adminDb.collection(this.collectionName).doc(adminId).update({
      password: hashedPassword,
      updatedAt: Timestamp.now(),
    });
  }

  async getById(id: string): Promise<AdminWithId> {
    const docRef = adminDb.collection(this.collectionName).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error(`Admin with id ${id} not found`);
    }

    const data = docSnap.data()!;
    return {
      id: docSnap.id,
      ...data,
      createdAt: this.convertAdminTimestampToClient(data.createdAt),
      updatedAt: this.convertAdminTimestampToClient(data.updatedAt),
    } as AdminWithId;
  }

  async getAll(): Promise<AdminWithId[]> {
    const snapshot = await adminDb.collection(this.collectionName).get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: this.convertAdminTimestampToClient(data.createdAt),
        updatedAt: this.convertAdminTimestampToClient(data.updatedAt),
      };
    }) as AdminWithId[];
  }

  async delete(id: string): Promise<void> {
    const admin = await this.getById(id);
    
    if (admin.username === 'admin') {
      throw new Error("Não é possível eliminar o usuário 'admin'");
    }

    await adminDb.collection(this.collectionName).doc(id).delete();
  }
}

export const adminRepositoryServer = new AdminRepositoryServer();

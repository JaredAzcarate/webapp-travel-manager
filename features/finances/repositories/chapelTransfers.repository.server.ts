import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { Timestamp as ClientTimestamp } from "firebase/firestore";
import {
  ChapelTransferWithId,
} from "../models/chapelTransfers.model";

export class ChapelTransferRepositoryServer {
  private collectionName = "chapelTransfers";

  private convertAdminTimestampToClient(
    adminTimestamp: unknown
  ): ClientTimestamp | undefined {
    if (!adminTimestamp) return undefined;
    if (
      typeof adminTimestamp === "object" &&
      adminTimestamp !== null &&
      "toDate" in adminTimestamp &&
      typeof (adminTimestamp as { toDate: () => Date }).toDate === "function"
    ) {
      return ClientTimestamp.fromDate(
        (adminTimestamp as { toDate: () => Date }).toDate()
      );
    }
    return adminTimestamp as ClientTimestamp;
  }

  private mapDoc(
    id: string,
    data: FirebaseFirestore.DocumentData
  ): ChapelTransferWithId {
    return {
      id,
      ...data,
      transferredAt: this.convertAdminTimestampToClient(data.transferredAt)!,
      createdAt: this.convertAdminTimestampToClient(data.createdAt)!,
      updatedAt: this.convertAdminTimestampToClient(data.updatedAt)!,
    } as ChapelTransferWithId;
  }

  async getByCaravanId(caravanId: string): Promise<ChapelTransferWithId[]> {
    const snapshot = await adminDb
      .collection(this.collectionName)
      .where("caravanId", "==", caravanId)
      .get();

    return snapshot.docs
      .map((doc) => this.mapDoc(doc.id, doc.data()))
      .sort(
        (a, b) =>
          (b.transferredAt?.toMillis?.() ?? 0) -
          (a.transferredAt?.toMillis?.() ?? 0)
      );
  }

  async getByCaravanAndChapel(
    caravanId: string,
    chapelId: string
  ): Promise<ChapelTransferWithId[]> {
    const snapshot = await adminDb
      .collection(this.collectionName)
      .where("caravanId", "==", caravanId)
      .where("chapelId", "==", chapelId)
      .get();

    return snapshot.docs
      .map((doc) => this.mapDoc(doc.id, doc.data()))
      .sort(
        (a, b) =>
          (b.transferredAt?.toMillis?.() ?? 0) -
          (a.transferredAt?.toMillis?.() ?? 0)
      );
  }

  async getAll(): Promise<ChapelTransferWithId[]> {
    const snapshot = await adminDb.collection(this.collectionName).get();
    return snapshot.docs.map((doc) => this.mapDoc(doc.id, doc.data()));
  }

  async create(input: {
    caravanId: string;
    chapelId: string;
    amount: number;
    transferredAt: Timestamp;
    registeredBy: string;
    notes?: string;
  }): Promise<ChapelTransferWithId> {
    const now = Timestamp.now();
    const docRef = await adminDb.collection(this.collectionName).add({
      ...input,
      createdAt: now,
      updatedAt: now,
    });
    const docSnap = await docRef.get();
    return this.mapDoc(docSnap.id, docSnap.data()!);
  }

  async delete(id: string): Promise<void> {
    await adminDb.collection(this.collectionName).doc(id).delete();
  }
}

export const chapelTransferRepositoryServer =
  new ChapelTransferRepositoryServer();

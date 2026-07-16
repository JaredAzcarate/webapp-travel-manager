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

  async getByChapelId(chapelId: string): Promise<ChapelTransferWithId[]> {
    const snapshot = await adminDb
      .collection(this.collectionName)
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

  async getById(id: string): Promise<ChapelTransferWithId> {
    const docSnap = await adminDb.collection(this.collectionName).doc(id).get();
    if (!docSnap.exists) {
      throw new Error(`Chapel transfer with id ${id} not found`);
    }
    return this.mapDoc(docSnap.id, docSnap.data()!);
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
    creditGenerated?: number;
    creditRemaining?: number;
    creditUsed?: number;
    creditAllocations?: Array<{ transferId: string; amount: number }>;
  }): Promise<ChapelTransferWithId> {
    const now = Timestamp.now();
    const {
      notes,
      creditGenerated,
      creditRemaining,
      creditUsed,
      creditAllocations,
      ...rest
    } = input;
    const payload: Record<string, unknown> = {
      ...rest,
      createdAt: now,
      updatedAt: now,
    };
    if (notes?.trim()) {
      payload.notes = notes.trim();
    }
    if (creditGenerated && creditGenerated > 0) {
      payload.creditGenerated = creditGenerated;
      payload.creditRemaining =
        creditRemaining ?? creditGenerated;
    }
    if (creditUsed && creditUsed > 0) {
      payload.creditUsed = creditUsed;
    }
    if (creditAllocations && creditAllocations.length > 0) {
      payload.creditAllocations = creditAllocations;
    }

    const docRef = await adminDb.collection(this.collectionName).add(payload);
    const docSnap = await docRef.get();
    return this.mapDoc(docSnap.id, docSnap.data()!);
  }

  async update(
    id: string,
    input: {
      creditRemaining?: number;
      notes?: string;
    }
  ): Promise<ChapelTransferWithId> {
    const now = Timestamp.now();
    await adminDb.collection(this.collectionName).doc(id).update({
      ...input,
      updatedAt: now,
    });
    return this.getById(id);
  }

  async delete(id: string): Promise<void> {
    await adminDb.collection(this.collectionName).doc(id).delete();
  }
}

export const chapelTransferRepositoryServer =
  new ChapelTransferRepositoryServer();

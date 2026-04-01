import { adminDb } from "@/lib/firebase-admin";
import {
  CreateFeedbackTicketInput,
  FeedbackTicketWithId,
  UpdateFeedbackTicketInput,
} from "@/features/feedback/models/feedbackTickets.model";
import { Timestamp as AdminTimestamp } from "firebase-admin/firestore";
import { Timestamp as ClientTimestamp } from "firebase/firestore";

export class FeedbackTicketsRepositoryServer {
  private collectionName = "feedbackTickets";

  private toClientTs(
    value: AdminTimestamp | undefined
  ): ClientTimestamp | undefined {
    if (!value) return undefined;
    return ClientTimestamp.fromDate(value.toDate());
  }

  async create(input: CreateFeedbackTicketInput): Promise<FeedbackTicketWithId> {
    const now = AdminTimestamp.now();
    const docRef = await adminDb.collection(this.collectionName).add({
      ...input,
      createdAt: now,
      updatedAt: now,
    });
    const snap = await docRef.get();
    const data = snap.data()!;
    return {
      id: snap.id,
      ...data,
      createdAt: this.toClientTs(data.createdAt)!,
      updatedAt: this.toClientTs(data.updatedAt)!,
    } as FeedbackTicketWithId;
  }

  async getAll(): Promise<FeedbackTicketWithId[]> {
    const snapshot = await adminDb
      .collection(this.collectionName)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: this.toClientTs(data.createdAt)!,
        updatedAt: this.toClientTs(data.updatedAt)!,
      } as FeedbackTicketWithId;
    });
  }

  async update(id: string, input: UpdateFeedbackTicketInput): Promise<void> {
    await adminDb
      .collection(this.collectionName)
      .doc(id)
      .update({
        ...input,
        updatedAt: AdminTimestamp.now(),
      });
  }
}

export const feedbackTicketsRepositoryServer = new FeedbackTicketsRepositoryServer();

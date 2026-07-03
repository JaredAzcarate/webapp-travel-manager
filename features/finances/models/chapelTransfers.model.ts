import { CreateInput, UpdateInput, WithId } from "@/common/models/index";
import { Timestamp } from "firebase/firestore";

export interface ChapelTransfer {
  caravanId: string;
  chapelId: string;
  amount: number;
  transferredAt: Timestamp;
  registeredBy: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateChapelTransferInput = CreateInput<ChapelTransfer>;
export type UpdateChapelTransferInput = UpdateInput<ChapelTransfer>;
export type ChapelTransferWithId = WithId<ChapelTransfer>;

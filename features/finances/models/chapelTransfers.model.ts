import { CreateInput, UpdateInput, WithId } from "@/common/models/index";
import { Timestamp } from "firebase/firestore";

export interface ChapelTransferCreditAllocation {
  transferId: string;
  amount: number;
}

export interface ChapelTransfer {
  caravanId: string;
  chapelId: string;
  amount: number;
  transferredAt: Timestamp;
  registeredBy: string;
  notes?: string;
  /** Excess over trip pending that increased chapel.creditBalance */
  creditGenerated?: number;
  /** Remaining unused portion of creditGenerated (for lock/delete UI) */
  creditRemaining?: number;
  /** Amount taken from chapel.creditBalance to pay trip pending */
  creditUsed?: number;
  /** FIFO sources consumed when creditUsed > 0 */
  creditAllocations?: ChapelTransferCreditAllocation[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateChapelTransferInput = CreateInput<ChapelTransfer>;
export type UpdateChapelTransferInput = UpdateInput<ChapelTransfer>;
export type ChapelTransferWithId = WithId<ChapelTransfer>;

import { CreateInput, UpdateInput, WithId } from "@/common/models/index";
import { Timestamp } from "firebase/firestore";

export type FeedbackTicketType = "ERROR" | "SUGGESTION";

export type FeedbackTicketStatus = "OPEN" | "ARCHIVED";

export interface FeedbackTicket {
  type: FeedbackTicketType;
  message: string;
  pageUrl?: string;
  userAgent?: string;
  status: FeedbackTicketStatus;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateFeedbackTicketInput = CreateInput<FeedbackTicket>;
export type UpdateFeedbackTicketInput = UpdateInput<FeedbackTicket>;
export type FeedbackTicketWithId = WithId<FeedbackTicket>;

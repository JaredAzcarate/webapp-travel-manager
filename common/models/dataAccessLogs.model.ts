import { CreateInput, WithId } from "./index";
import { Timestamp } from "firebase/firestore";

export interface DataAccessLog {
  registrationId: string;
  action: "VIEW" | "EXPORT" | "DELETE" | "WITHDRAW_CONSENT";
  accessedBy: "USER" | "ADMIN" | "CHAPEL";
  accessedAt: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

export type CreateDataAccessLogInput = CreateInput<DataAccessLog>;
export type DataAccessLogWithId = WithId<DataAccessLog>;

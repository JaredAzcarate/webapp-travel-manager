import { CreateInput, WithId } from "./index";
import { Timestamp } from "firebase/firestore";

export interface DataAccessLog {
  registrationId: string;
  action: "VIEW" | "EXPORT" | "DELETE" | "WITHDRAW_CONSENT";
  accessedBy: "USER" | "ADMIN" | "CHAPEL";
  accessedAt: Timestamp;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateDataAccessLogInput = Omit<DataAccessLog, "createdAt" | "updatedAt" | "id" | "accessedAt"> & {
  accessedAt?: Timestamp;
};

export type DataAccessLogWithId = WithId<DataAccessLog>;

import { CreateInput, UpdateInput, WithId } from "@/common/models/index";
import { Timestamp } from "firebase/firestore";

export interface Admin {
  username: string;
  password: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export type CreateAdminInput = CreateInput<Admin>;
export type UpdateAdminInput = UpdateInput<Admin>;
export type AdminWithId = WithId<Admin>;

import { CreateInput, UpdateInput, WithId } from "@/common/models/index";
import { Timestamp } from "firebase/firestore";

export type PanelAdminRole = "ADMIN" | "SECRETARY";

export interface Admin {
  username: string;
  password: string;
  role?: PanelAdminRole;
  chapelId?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export type CreateAdminInput = CreateInput<Admin>;
export type UpdateAdminInput = UpdateInput<Admin>;
export type AdminWithId = WithId<Admin>;

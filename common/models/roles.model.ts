import { Timestamp } from "firebase/firestore";
import { CreateInput, UpdateInput, WithId } from "./index";

// Modelo específico de Role
export interface Role {
  name: string;
  [key: string]: unknown;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Tipos derivados del modelo
export type CreateRoleInput = CreateInput<Role>;
export type UpdateRoleInput = UpdateInput<Role>;
export type RoleWithId = WithId<Role>;

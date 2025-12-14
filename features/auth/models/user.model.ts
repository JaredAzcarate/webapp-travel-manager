import { CreateInput, UpdateInput, WithId } from "@/common/models/index";
import { Timestamp } from "firebase/firestore";

export interface User {
  name: string;
  email: string;
  roleId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  [key: string]: unknown;
}

export type CreateUserInput = CreateInput<User>;
export type UpdateUserInput = UpdateInput<User>;
export type UserWithId = WithId<User>;

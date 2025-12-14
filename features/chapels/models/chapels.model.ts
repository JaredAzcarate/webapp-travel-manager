import { CreateInput, UpdateInput, WithId } from "@/common/models/index";
import { Timestamp } from "firebase/firestore";

// Modelo específico de Chapel
export interface Chapel {
  name: string;
  whatsappPhone?: string;
  email?: string;
  address?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Tipos derivados del modelo
export type CreateChapelInput = CreateInput<Chapel>;
export type UpdateChapelInput = UpdateInput<Chapel>;
export type ChapelWithId = WithId<Chapel>;

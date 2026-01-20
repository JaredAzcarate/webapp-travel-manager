import { CreateInput, UpdateInput, WithId } from "@/common/models/index";
import { Timestamp } from "firebase/firestore";

export interface OrdinanceSession {
  id: string;
  slot: string; // e.g. "9:30-10:00"
  maxCapacity: number; // Cupos máximos por sesión
  gender?: "M" | "F" | null; // null = ambos, "M" = solo hombres, "F" = solo mujeres
}

export interface Ordinance {
  name: string; // "Batistério", "Iniciatória", etc.
  description?: string;
  sessions: OrdinanceSession[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Tipos derivados del modelo
export type CreateOrdinanceInput = CreateInput<Ordinance>;
export type UpdateOrdinanceInput = UpdateInput<Ordinance>;
export type OrdinanceWithId = WithId<Ordinance>;

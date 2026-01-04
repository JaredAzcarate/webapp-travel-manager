import { CreateInput, UpdateInput, WithId } from "@/common/models/index";
import { OrdinanceType } from "@/features/registrations/models/registrations.model";
import { Timestamp } from "firebase/firestore";

export interface Caravan {
  name: string;
  departureAt: Timestamp;
  returnAt: Timestamp;
  formOpenAt: Timestamp;
  formCloseAt: Timestamp;
  isActive: boolean;
  busIds: string[]; // references to buses.id
  ordinanceCapacityLimits?: {
    [type in OrdinanceType]?: {
      [slot: string]: number | { M: number; F: number }; // límite máximo por sesión (simple o por género)
    };
  };
  ordinanceCapacityCounts?: {
    [type in OrdinanceType]?: {
      [slot: string]: number | { M: number; F: number }; // contador actual (simple o por género)
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateCaravanInput = CreateInput<Caravan>;
export type UpdateCaravanInput = UpdateInput<Caravan>;
export type CaravanWithId = WithId<Caravan>;

import { CreateInput, UpdateInput, WithId } from "@/common/models/index";
import { Timestamp } from "firebase/firestore";

export type CaravanFinancialStatus = "OPEN" | "CLOSED";

export interface CaravanPricing {
  adultPrice: number;
  childPrice: number;
}

export interface Caravan {
  name: string;
  departureAt: Timestamp;
  returnAt: Timestamp;
  formOpenAt: Timestamp;
  formCloseAt: Timestamp;
  isActive: boolean;
  busIds: string[]; // references to buses.id
  pricing?: CaravanPricing;
  financialStatus?: CaravanFinancialStatus;
  financialClosedAt?: Timestamp;
  ordinanceCapacityLimits?: {
    [ordinanceId: string]: {
      [slot: string]: number | { M: number; F: number }; // límite máximo por sesión (simple o por género)
    };
  };
  ordinanceCapacityCounts?: {
    [ordinanceId: string]: {
      [slot: string]: number | { M: number; F: number }; // contador actual (simple o por género)
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateCaravanInput = CreateInput<Caravan>;
export type UpdateCaravanInput = UpdateInput<Caravan>;
export type CaravanWithId = WithId<Caravan>;

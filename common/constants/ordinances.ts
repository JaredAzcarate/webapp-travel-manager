import { OrdinanceType } from "@/features/registrations/models/registrations.model";

export const ORDINANCE_SLOTS: Record<OrdinanceType, string[]> = {
  INITIATORY: [
    "9:30-10:00",
    "10:00-10:30",
    "10:30-11:00",
    "14:00-14:30",
    "14:30-15:00",
    "15:00-15:30",
    "15:30-16:00",
  ],
  BAPTISTRY: ["9:30-11:00", "11:00-12:30", "14:00-15:30"],
  ENDOWMENT: [
    "9:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
  ],
  SEALING: ["10:00-11:00", "11:00-12:00", "15:00-16:00", "16:00-17:00"],
};

export const ORDINANCE_NAMES: Record<OrdinanceType, string> = {
  INITIATORY: "Iniciatória",
  BAPTISTRY: "Batistério",
  ENDOWMENT: "Investidura",
  SEALING: "Selamento",
};

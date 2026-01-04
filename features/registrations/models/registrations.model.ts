import { CreateInput, UpdateInput, WithId } from "@/common/models/index";
import { Timestamp } from "firebase/firestore";

export type OrdinanceType =
  | "BAPTISTRY"
  | "INITIATORY"
  | "ENDOWMENT"
  | "SEALING";

export type PaymentStatus = "PENDING" | "PAID" | "FREE" | "CANCELLED";

export type ParticipationStatus = "ACTIVE" | "CANCELLED" | "WAITLIST";

export interface Registration {
  caravanId: string; // references caravans.id
  chapelId: string; // chapel of departure
  busId: string; // assigned bus

  phone: string; // main identifier for this caravan (unique per caravanId)
  fullName: string;
  isAdult: boolean; // true = adult, false = youth
  gender: "M" | "F";
  isOfficiator: boolean;

  legalGuardianName?: string;
  legalGuardianEmail?: string;
  legalGuardianPhone?: string;

  ordinances: Array<{
    type: OrdinanceType;
    slot: string; // e.g. "9:30-10:00"
    isPersonal?: boolean; // indica si la ordenanza es personal
  }>; // Máximo 3, mínimo 0 (opcional)

  isFirstTimeConvert: boolean;
  paymentStatus: PaymentStatus;
  paymentConfirmedAt?: Timestamp;
  userReportedPaymentAt?: Timestamp;

  participationStatus: ParticipationStatus;
  cancellationReason?: string;
  cancelledAt?: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateRegistrationInput = CreateInput<Registration>;
export type UpdateRegistrationInput = UpdateInput<Registration>;
export type RegistrationWithId = WithId<Registration>;

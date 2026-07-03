import {
  getEffectiveFinancialStatus,
  getTripPrice,
  resolveCaravanPricing,
  roundEuroAmount,
} from "@/common/utils/tripPrice.utils";
import type { CaravanWithId } from "@/features/caravans/models/caravans.model";
import type { RegistrationWithId } from "@/features/registrations/models/registrations.model";

export interface ChapelFinanceCounts {
  adults: number;
  youth: number;
  children: number;
  firstTimeConvert: number;
}

export interface ChapelFinanceAmounts {
  totalDue: number;
  totalPaid: number;
  balance: number;
}

export interface ChapelFinanceRow extends ChapelFinanceCounts, ChapelFinanceAmounts {
  chapelId: string;
  chapelName: string;
}

export function computeRegistrationTripAmount(
  registration: RegistrationWithId,
  pricing: ReturnType<typeof resolveCaravanPricing>
): number {
  if (registration.participationStatus !== "ACTIVE") {
    return 0;
  }
  if (registration.paymentStatus === "FREE") {
    return 0;
  }
  return getTripPrice(registration.ageCategory, pricing);
}

export function aggregateRegistrationsByChapel(
  registrations: RegistrationWithId[],
  pricing: ReturnType<typeof resolveCaravanPricing>
): Map<string, ChapelFinanceCounts & { totalDue: number }> {
  const map = new Map<string, ChapelFinanceCounts & { totalDue: number }>();

  for (const registration of registrations) {
    if (registration.participationStatus !== "ACTIVE") {
      continue;
    }

    const chapelId = registration.chapelId;
    const current = map.get(chapelId) ?? {
      adults: 0,
      youth: 0,
      children: 0,
      firstTimeConvert: 0,
      totalDue: 0,
    };

    if (registration.ageCategory === "ADULT") {
      current.adults += 1;
    } else if (registration.ageCategory === "YOUTH") {
      current.youth += 1;
    } else if (registration.ageCategory === "CHILD") {
      current.children += 1;
    }

    if (registration.isFirstTimeConvert) {
      current.firstTimeConvert += 1;
    }

    current.totalDue = roundEuroAmount(
      current.totalDue + computeRegistrationTripAmount(registration, pricing)
    );

    map.set(chapelId, current);
  }

  return map;
}

export function buildChapelFinanceRows(
  chapels: Array<{ id: string; name: string }>,
  registrationAggregates: Map<string, ChapelFinanceCounts & { totalDue: number }>,
  transfersByChapel: Map<string, number>
): ChapelFinanceRow[] {
  return chapels
    .map((chapel) => {
      const agg = registrationAggregates.get(chapel.id) ?? {
        adults: 0,
        youth: 0,
        children: 0,
        firstTimeConvert: 0,
        totalDue: 0,
      };
      const totalPaid = roundEuroAmount(transfersByChapel.get(chapel.id) ?? 0);
      const totalDue = roundEuroAmount(agg.totalDue);
      return {
        chapelId: chapel.id,
        chapelName: chapel.name,
        adults: agg.adults,
        youth: agg.youth,
        children: agg.children,
        firstTimeConvert: agg.firstTimeConvert,
        totalDue,
        totalPaid,
        balance: roundEuroAmount(totalDue - totalPaid),
      };
    })
    .sort((a, b) => a.chapelName.localeCompare(b.chapelName, "pt"));
}

export function isCaravanFinanciallyOpen(caravan: CaravanWithId): boolean {
  return getEffectiveFinancialStatus(caravan) === "OPEN";
}

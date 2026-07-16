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

/** Pending amount owed by the chapel (positive balance only). */
export function pendingFromBalance(balance: number): number {
  return roundEuroAmount(Math.max(balance, 0));
}

/** Credit in favor of the chapel (absolute value of negative balance). */
export function creditFromBalance(balance: number): number {
  return roundEuroAmount(Math.max(-balance, 0));
}

export function getActiveParticipantCount(row: ChapelFinanceCounts): number {
  return row.adults + row.youth + row.children;
}

/** A credit-generating transfer can be deleted only if none of its credit was used. */
export function canDeleteChapelTransfer(transfer: {
  creditGenerated?: number;
  creditRemaining?: number;
}): boolean {
  const generated = roundEuroAmount(transfer.creditGenerated ?? 0);
  if (generated <= 0) {
    return true;
  }
  const remaining = roundEuroAmount(
    transfer.creditRemaining ?? generated
  );
  return remaining >= generated;
}

export function getChapelCreditBalance(
  chapel: { creditBalance?: number } | null | undefined
): number {
  return roundEuroAmount(Math.max(chapel?.creditBalance ?? 0, 0));
}

/**
 * Splits a payment into credit used from the chapel box, amount toward trip due,
 * and excess that generates new chapel credit.
 */
export function allocateChapelTransferCredit(params: {
  amount: number;
  pendingBalance: number;
  chapelCreditBalance: number;
  applyCreditAmount?: number;
}): {
  creditUsed: number;
  creditGenerated: number;
  creditBalanceAfter: number;
} {
  const amount = roundEuroAmount(Math.max(params.amount, 0));
  const pending = roundEuroAmount(Math.max(params.pendingBalance, 0));
  const chapelCredit = roundEuroAmount(Math.max(params.chapelCreditBalance, 0));
  const requestedCredit = roundEuroAmount(
    Math.max(params.applyCreditAmount ?? 0, 0)
  );

  const creditUsed = roundEuroAmount(
    Math.min(requestedCredit, chapelCredit, amount, pending)
  );
  const newMoney = roundEuroAmount(amount - creditUsed);
  const pendingAfterCredit = roundEuroAmount(pending - creditUsed);
  const towardDueFromNewMoney = roundEuroAmount(
    Math.min(newMoney, pendingAfterCredit)
  );
  const creditGenerated = roundEuroAmount(newMoney - towardDueFromNewMoney);
  const creditBalanceAfter = roundEuroAmount(
    Math.max(chapelCredit - creditUsed + creditGenerated, 0)
  );

  return {
    creditUsed,
    creditGenerated,
    creditBalanceAfter,
  };
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

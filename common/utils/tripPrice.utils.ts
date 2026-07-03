import type { AgeCategory } from "@/features/registrations/models/registrations.model";
import type {
  CaravanPricing,
  CaravanWithId,
} from "@/features/caravans/models/caravans.model";
import { toDate } from "@/common/utils/timestamp.utils";

/** Default trip prices in euros when caravan has no pricing configured */
export const DEFAULT_ADULT_PRICE = 25;
export const DEFAULT_CHILD_PRICE = 10;

export const DEFAULT_CARAVAN_PRICING: CaravanPricing = {
  adultPrice: DEFAULT_ADULT_PRICE,
  childPrice: DEFAULT_CHILD_PRICE,
};

/** Caravans with departure before this date are treated as financially closed */
export const FINANCE_TRACKING_START_DATE = new Date("2026-07-10T00:00:00");

/**
 * Returns the trip price in euros based on age category and caravan pricing.
 * Jovens (11-17) and crianças (1-10): childPrice
 * Adultos (18+): adultPrice
 */
export function getTripPrice(
  ageCategory: AgeCategory | undefined,
  pricing: CaravanPricing = DEFAULT_CARAVAN_PRICING
): number {
  if (!ageCategory || ageCategory === "ADULT") {
    return pricing.adultPrice;
  }
  return pricing.childPrice;
}

export function resolveCaravanPricing(
  caravan: Pick<CaravanWithId, "pricing">
): CaravanPricing {
  return {
    adultPrice: caravan.pricing?.adultPrice ?? DEFAULT_ADULT_PRICE,
    childPrice: caravan.pricing?.childPrice ?? DEFAULT_CHILD_PRICE,
  };
}

export function getEffectiveFinancialStatus(
  caravan: Pick<CaravanWithId, "financialStatus" | "departureAt">
): "OPEN" | "CLOSED" {
  if (caravan.financialStatus) {
    return caravan.financialStatus;
  }
  const departure = toDate(caravan.departureAt);
  if (!departure) {
    return "CLOSED";
  }
  return departure >= FINANCE_TRACKING_START_DATE ? "OPEN" : "CLOSED";
}

export function formatEuroAmount(amount: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function roundEuroAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}

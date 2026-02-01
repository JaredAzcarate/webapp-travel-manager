import type { AgeCategory } from "@/features/registrations/models/registrations.model";

/** Trip price in euros. CHILD and YOUTH: 10€, ADULT: 25€ */
export const TRIP_PRICE_YOUTH_CHILD = 10;
export const TRIP_PRICE_ADULT = 25;

/**
 * Returns the trip price in euros based on age category.
 * Jovens (11-17) and crianças (1-10): 10€
 * Adultos (18+): 25€
 */
export function getTripPrice(
  ageCategory: AgeCategory | undefined
): number {
  if (!ageCategory || ageCategory === "ADULT") {
    return TRIP_PRICE_ADULT;
  }
  return TRIP_PRICE_YOUTH_CHILD;
}

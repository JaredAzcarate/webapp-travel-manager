import type { CaravanWithId } from "@/features/caravans/models/caravans.model";
import {
  type CapacityValue,
  isGenderSpecificLimit,
} from "@/features/caravans/utils/ordinanceCapacity.utils";

function slotHasUsage(count: CapacityValue | undefined): boolean {
  if (count === undefined) return false;
  if (isGenderSpecificLimit(count)) {
    return (count.M || 0) > 0 || (count.F || 0) > 0;
  }
  return count > 0;
}

function isLimitBelowUsage(limit: CapacityValue, count: CapacityValue | undefined): boolean {
  if (count === undefined) return false;

  if (isGenderSpecificLimit(limit)) {
    if (isGenderSpecificLimit(count)) {
      return count.M > limit.M || count.F > limit.F;
    }
    const total = typeof count === "number" ? count : 0;
    return total > limit.M + limit.F;
  }

  const lim = limit as number;
  if (isGenderSpecificLimit(count)) {
    return count.M + count.F > lim;
  }
  return (count as number) > lim;
}

/**
 * Validates that new ordinance capacity limits are not below current counts
 * and that removing a slot is only allowed when usage is zero.
 */
export function validateOrdinanceCapacityLimitsUpdate(
  caravan: CaravanWithId,
  newLimits: NonNullable<CaravanWithId["ordinanceCapacityLimits"]>
): { ok: true } | { ok: false; message: string } {
  const oldLimits = caravan.ordinanceCapacityLimits || {};
  const counts = caravan.ordinanceCapacityCounts || {};

  for (const ordId of Object.keys(oldLimits)) {
    const oldSlots = oldLimits[ordId] || {};
    for (const slot of Object.keys(oldSlots)) {
      if (newLimits[ordId]?.[slot] === undefined) {
        const c = counts[ordId]?.[slot];
        if (slotHasUsage(c)) {
          return {
            ok: false,
            message: `Não é possível remover o horário "${slot}" da ordenança ${ordId}: ainda há inscrições.`,
          };
        }
      }
    }
  }

  for (const ordId of Object.keys(newLimits)) {
    const slots = newLimits[ordId] || {};
    for (const slot of Object.keys(slots)) {
      const limit = slots[slot] as CapacityValue;
      const count = counts[ordId]?.[slot];
      if (isLimitBelowUsage(limit, count)) {
        return {
          ok: false,
          message: `O limite para "${slot}" (ordenança ${ordId}) não pode ser inferior ao número de inscrições atuais.`,
        };
      }
    }
  }

  return { ok: true };
}

/**
 * Builds new count map: keeps existing counts for preserved keys, inits zeros for new keys.
 */
export function mergeOrdinanceCapacityCounts(
  caravan: CaravanWithId,
  newLimits: NonNullable<CaravanWithId["ordinanceCapacityLimits"]>
): NonNullable<CaravanWithId["ordinanceCapacityCounts"]> {
  const oldCounts = caravan.ordinanceCapacityCounts || {};
  const result: NonNullable<CaravanWithId["ordinanceCapacityCounts"]> = {};

  for (const ordId of Object.keys(newLimits)) {
    result[ordId] = {};
    const slots = newLimits[ordId] || {};
    for (const slot of Object.keys(slots)) {
      const limit = slots[slot] as CapacityValue;
      const prev = oldCounts[ordId]?.[slot];

      if (prev !== undefined) {
        (result[ordId] as Record<string, CapacityValue>)[slot] = prev;
      } else if (isGenderSpecificLimit(limit)) {
        (result[ordId] as Record<string, CapacityValue>)[slot] = { M: 0, F: 0 };
      } else {
        (result[ordId] as Record<string, CapacityValue>)[slot] = 0;
      }
    }
  }

  return result;
}

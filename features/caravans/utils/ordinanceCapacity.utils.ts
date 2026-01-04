export type CapacityValue = number | { M: number; F: number };

export function isGenderSpecificLimit(
  limit: CapacityValue
): limit is { M: number; F: number } {
  return (
    typeof limit === "object" && limit !== null && "M" in limit && "F" in limit
  );
}

export function getLimitForGender(
  limit: CapacityValue,
  gender: "M" | "F" | null
): number {
  if (isGenderSpecificLimit(limit)) {
    if (gender === "M") return limit.M;
    if (gender === "F") return limit.F;
    return limit.M + limit.F;
  }
  return limit;
}

export function getCountForGender(
  count: CapacityValue,
  gender: "M" | "F" | null
): number {
  if (isGenderSpecificLimit(count)) {
    if (gender === "M") return count.M;
    if (gender === "F") return count.F;
    return count.M + count.F;
  }
  return count;
}

export function incrementCountByGender(
  counts: Record<string, CapacityValue>,
  slot: string,
  gender: "M" | "F"
): void {
  if (!counts[slot]) {
    counts[slot] = isGenderSpecificLimit(counts[slot] as CapacityValue)
      ? { M: 0, F: 0 }
      : 0;
  }

  const current = counts[slot];
  if (isGenderSpecificLimit(current)) {
    current[gender] = (current[gender] || 0) + 1;
  } else {
    counts[slot] = (current || 0) + 1;
  }
}

export function decrementCountByGender(
  counts: Record<string, CapacityValue>,
  slot: string,
  gender: "M" | "F"
): void {
  const current = counts[slot];
  if (!current) return;

  if (isGenderSpecificLimit(current)) {
    current[gender] = Math.max(0, (current[gender] || 0) - 1);
  } else {
    counts[slot] = Math.max(0, (current as number) - 1);
  }
}

export function getOrdinanceCapacityLimit(
  limits: Record<string, CapacityValue> | undefined,
  slot: string
): CapacityValue | undefined {
  return limits?.[slot];
}

export function getOrdinanceCapacityCount(
  counts: Record<string, CapacityValue> | undefined,
  slot: string
): CapacityValue | undefined {
  return counts?.[slot];
}

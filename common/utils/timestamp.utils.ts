/**
 * Safely converts Firestore Timestamp (or serialized equivalent) to Date.
 * Handles: Firestore Timestamp, plain {seconds, nanoseconds}, Date, ISO string.
 */
export function toDate(
  value:
    | { toDate?: () => Date; seconds?: number; _seconds?: number; nanoseconds?: number; _nanoseconds?: number }
    | Date
    | string
    | null
    | undefined
): Date | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);

  const ts = value as {
    toDate?: () => Date;
    seconds?: number;
    _seconds?: number;
    nanoseconds?: number;
    _nanoseconds?: number;
  };

  if (typeof ts.toDate === "function") {
    return ts.toDate();
  }

  const seconds = ts.seconds ?? ts._seconds;
  const nanoseconds = ts.nanoseconds ?? ts._nanoseconds ?? 0;
  if (typeof seconds === "number") {
    return new Date(seconds * 1000 + nanoseconds / 1_000_000);
  }

  return undefined;
}

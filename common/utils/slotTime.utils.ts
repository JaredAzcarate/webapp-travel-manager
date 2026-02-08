/**
 * Parses a slot string (e.g. "9:30-10:00", "11h", "12:30h") and returns
 * minutes since midnight for the start time, for ordering sessions.
 */
export function parseSlotToMinutes(slot: string): number {
  if (!slot || typeof slot !== "string") return 0;

  const trimmed = slot.trim();

  // Range format: "9:30-10:00" or "9:30 - 10:00" — use first time
  const rangeMatch = trimmed.match(/^(\d{1,2}):?(\d{2})?/);
  if (rangeMatch) {
    const hours = parseInt(rangeMatch[1], 10);
    const minutes = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : 0;
    if (!Number.isNaN(hours)) {
      return hours * 60 + minutes;
    }
  }

  // "11h" or "12:30h" — optional colon before "h"
  const suffixH = trimmed.match(/^(\d{1,2}):?(\d{2})?h$/i);
  if (suffixH) {
    const hours = parseInt(suffixH[1], 10);
    const minutes = suffixH[2] ? parseInt(suffixH[2], 10) : 0;
    if (!Number.isNaN(hours)) {
      return hours * 60 + minutes;
    }
  }

  // Plain "HH:mm" or "H:mm"
  const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      return hours * 60 + minutes;
    }
  }

  return 0;
}

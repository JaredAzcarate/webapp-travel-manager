import { OrdinanceWithId } from "@/features/ordinances/models/ordinances.model";
import { AgeCategory } from "@/features/registrations/models/registrations.model";

export interface OrdinanceFormValue {
  ordinanceId?: string;
  slot?: string;
  isPersonal?: boolean;
}

// Utility function to parse time slot (e.g., "9:30-10:00" -> { start: "9:30", end: "10:00" })
export const parseTimeSlot = (slot: string): { start: string; end: string } | null => {
  const match = slot.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
  if (!match) return null;
  return { start: match[1], end: match[2] };
};

// Utility function to convert time to minutes for comparison
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Check if two time slots overlap
export const doTimeSlotsOverlap = (
  slot1: string,
  slot2: string
): boolean => {
  const parsed1 = parseTimeSlot(slot1);
  const parsed2 = parseTimeSlot(slot2);
  if (!parsed1 || !parsed2) return false;

  const start1 = timeToMinutes(parsed1.start);
  const end1 = timeToMinutes(parsed1.end);
  const start2 = timeToMinutes(parsed2.start);
  const end2 = timeToMinutes(parsed2.end);

  return !(end1 <= start2 || end2 <= start1);
};

// Filter ordinances based on age category, gender, and restrictions
export const filterAvailableOrdinances = (
  ordinances: OrdinanceWithId[],
  gender: "M" | "F" | null,
  ageCategory: AgeCategory,
  isFirstTimeConvert: boolean,
  hasLessThanOneYearAsMember: boolean
): OrdinanceWithId[] => {
  const isRestricted =
    ageCategory === "YOUTH" || isFirstTimeConvert || hasLessThanOneYearAsMember;

  return ordinances.filter((o) => {
    // If restricted, only show BAPTISTRY ordinances
    if (isRestricted) {
      return o.name.toLowerCase().includes("batistério");
    }

    // Filter by gender: don't show ordinances that only have sessions for the opposite gender
    if (gender) {
      const hasAvailableSessions = o.sessions.some((session) => {
        if (!session.gender) return true; // null = both genders
        return session.gender === gender;
      });
      if (!hasAvailableSessions) return false;

      // Don't show "Iniciatória - Irmãs" for men
      if (gender === "M" && o.name.toLowerCase().includes("iniciatória") && o.name.toLowerCase().includes("irmãs")) {
        return false;
      }
      // Don't show "Iniciatória - Irmãos" for women
      if (gender === "F" && o.name.toLowerCase().includes("iniciatória") && o.name.toLowerCase().includes("irmãos")) {
        return false;
      }
    }

    return true;
  });
};

// Get available slots for an ordinance filtered by gender and non-overlapping with selected ordinances
export const getAvailableSlots = (
  ordinance: OrdinanceWithId,
  gender: "M" | "F" | null,
  selectedOrdinances: OrdinanceFormValue[]
): string[] => {
  // Filter sessions by gender
  const filteredSessions = ordinance.sessions.filter((session) => {
    if (!session.gender) return true; // null = both genders
    if (gender === null) return true; // user gender not selected yet
    return session.gender === gender;
  });

  // Extract unique slots
  const slotSet = new Set<string>();
  filteredSessions.forEach((session) => {
    if (session.slot) {
      slotSet.add(session.slot);
    }
  });

  let availableSlotsList = Array.from(slotSet);

  // Filter out slots that overlap with already selected ordinances
  if (selectedOrdinances.length > 0) {
    availableSlotsList = availableSlotsList.filter((slot) => {
      return !selectedOrdinances.some((selected) => {
        if (!selected.slot || selected.ordinanceId === ordinance.id) return false;
        return doTimeSlotsOverlap(slot, selected.slot);
      });
    });
  }

  return availableSlotsList;
};

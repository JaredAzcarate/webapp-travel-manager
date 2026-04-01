"use client";

import { OrdinanceCard } from "@/common/components/OrdinanceCard";
import {
  doTimeSlotsOverlap,
  getAvailableSlots,
  OrdinanceFormValue,
} from "@/common/utils/ordinances.utils";
import { OrdinanceWithId } from "@/features/ordinances/models/ordinances.model";
import { useOrdinanceSlotsAvailabilityFromCaravan } from "@/features/registrations/hooks/registrations.hooks";
import { useMemo } from "react";

export interface OrdinanceCardWrapperProps {
  ordinance: OrdinanceWithId;
  selected: boolean;
  selectedSessions: OrdinanceFormValue[];
  ordinancesList: OrdinanceFormValue[];
  selectedCaravanId: string | null;
  gender: "M" | "F" | null;
  disabled?: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onSlotsChange: (slots: string[]) => void;
  onPersonalChange: (isPersonal: boolean) => void;
}

export const OrdinanceCardWrapper: React.FC<OrdinanceCardWrapperProps> = ({
  ordinance,
  selected,
  selectedSessions,
  ordinancesList,
  selectedCaravanId,
  gender,
  disabled = false,
  onSelect,
  onDeselect,
  onSlotsChange,
  onPersonalChange,
}) => {
  const selectedSlots = useMemo(
    () =>
      selectedSessions
        .map((session) => session.slot)
        .filter((slot): slot is string => typeof slot === "string"),
    [selectedSessions]
  );

  const isPersonal = selectedSessions.some((session) => session.isPersonal === true);

  const availableSlots = useMemo(() => {
    const allSlots = getAvailableSlots(ordinance, gender, []);
    const otherSelectedSlots = ordinancesList
      .filter((ord) => ord?.ordinanceId && ord.ordinanceId !== ordinance.id && ord.slot)
      .map((ord) => ord.slot as string);

    return allSlots.filter((candidateSlot) => {
      if (selectedSlots.includes(candidateSlot)) return true;
      return !otherSelectedSlots.some((otherSlot) =>
        doTimeSlotsOverlap(candidateSlot, otherSlot)
      );
    });
  }, [ordinance, gender, ordinancesList, selectedSlots]);

  const { availabilityMap, loading: loadingSlotsAvailability } =
    useOrdinanceSlotsAvailabilityFromCaravan(
      selectedCaravanId ?? null,
      selected ? ordinance.id : null,
      selected ? availableSlots : [],
      gender
    );

  const slotAvailabilityMap = useMemo(() => {
    if (!selected || !selectedCaravanId) return undefined;

    const map: Record<
      string,
      { available: number; maxCapacity: number; loading: boolean }
    > = {};

    availableSlots.forEach((slot) => {
      const slotAvailability = availabilityMap[slot];
      map[slot] = {
        available: slotAvailability?.available ?? 0,
        maxCapacity: slotAvailability?.maxCapacity ?? 0,
        loading: loadingSlotsAvailability,
      };
    });

    return map;
  }, [
    selected,
    selectedCaravanId,
    availableSlots,
    availabilityMap,
    loadingSlotsAvailability,
  ]);

  return (
    <OrdinanceCard
      ordinance={ordinance}
      selected={selected}
      selectedSlots={selectedSlots}
      isPersonal={isPersonal}
      availableSlots={availableSlots}
      slotAvailabilityMap={slotAvailabilityMap}
      disabled={disabled}
      onSelect={onSelect}
      onDeselect={onDeselect}
      onSlotsChange={onSlotsChange}
      onPersonalChange={onPersonalChange}
    />
  );
};

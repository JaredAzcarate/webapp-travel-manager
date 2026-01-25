"use client";

import { OrdinanceCard } from "@/common/components/OrdinanceCard";
import { getAvailableSlots, OrdinanceFormValue } from "@/common/utils/ordinances.utils";
import { OrdinanceWithId } from "@/features/ordinances/models/ordinances.model";
import {
    useOrdinanceAvailabilityFromCaravan,
    useOrdinanceSlotsAvailabilityFromCaravan
} from "@/features/registrations/hooks/registrations.hooks";
import { useMemo } from "react";

export interface OrdinanceCardWrapperProps {
  ordinance: OrdinanceWithId;
  selected: boolean;
  selectedOrdinance?: OrdinanceFormValue;
  ordinancesList: OrdinanceFormValue[];
  selectedCaravanId: string | null;
  gender: "M" | "F" | null;
  disabled?: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onSlotChange: (slot: string | undefined) => void;
  onPersonalChange: (isPersonal: boolean) => void;
}

export const OrdinanceCardWrapper: React.FC<OrdinanceCardWrapperProps> = ({
  ordinance,
  selected,
  selectedOrdinance,
  ordinancesList,
  selectedCaravanId,
  gender,
  disabled = false,
  onSelect,
  onDeselect,
  onSlotChange,
  onPersonalChange,
}) => {
  const selectedSlot = selectedOrdinance?.slot;
  const isPersonal = selectedOrdinance?.isPersonal ?? false;

  // Get available slots for this ordinance
  const availableSlots = useMemo(() => {
    return getAvailableSlots(
      ordinance,
      gender,
      ordinancesList.filter(
        (ord) => ord.ordinanceId && ord.ordinanceId !== ordinance.id
      )
    );
  }, [ordinance, gender, ordinancesList]);

  // Get availability info for selected slot
  const { available, maxCapacity, loading: loadingAvailability } =
    useOrdinanceAvailabilityFromCaravan(
      selectedCaravanId ?? null,
      selected ? ordinance.id : null,
      selectedSlot ?? null,
      gender
    );

  // Get availability for all slots when ordinance is selected
  const { availabilityMap, loading: loadingSlotsAvailability } =
    useOrdinanceSlotsAvailabilityFromCaravan(
      selectedCaravanId ?? null,
      selected ? ordinance.id : null,
      selected ? availableSlots : [],
      gender
    );

  // Build slot availability map with loading state
  const slotAvailabilityMap = useMemo(() => {
    if (!selected || !selectedCaravanId) return undefined;
    
    const map: Record<string, { available: number; maxCapacity: number; loading: boolean }> = {};
    
    availableSlots.forEach((slot) => {
      const slotAvailability = availabilityMap[slot];
      map[slot] = {
        available: slotAvailability?.available ?? 0,
        maxCapacity: slotAvailability?.maxCapacity ?? 0,
        loading: loadingSlotsAvailability,
      };
    });
    
    return map;
  }, [selected, selectedCaravanId, availableSlots, availabilityMap, loadingSlotsAvailability]);

  return (
    <OrdinanceCard
      ordinance={ordinance}
      selected={selected}
      selectedSlot={selectedSlot}
      isPersonal={isPersonal}
      availableSlots={availableSlots}
      availability={
        selectedSlot
          ? {
              available,
              maxCapacity,
              loading: loadingAvailability,
            }
          : undefined
      }
      slotAvailabilityMap={slotAvailabilityMap}
      disabled={disabled}
      onSelect={onSelect}
      onDeselect={onDeselect}
      onSlotChange={onSlotChange}
      onPersonalChange={onPersonalChange}
    />
  );
};

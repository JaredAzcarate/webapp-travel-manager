"use client";

import { OrdinanceWithId } from "@/features/ordinances/models/ordinances.model";
import { Checkbox, Select, Tag } from "antd";
import { motion } from "motion/react";
import React, { useState } from "react";

export interface OrdinanceCardProps {
  ordinance: OrdinanceWithId;
  selected: boolean;
  selectedSlot?: string;
  selectedSessions?: Array<{ slot?: string; isPersonal?: boolean }>;
  isPersonal?: boolean;
  availableSlots: string[];
  availability?: { available: number; maxCapacity: number; loading: boolean };
  slotAvailabilityMap?: Record<string, { available: number; maxCapacity: number; loading: boolean }>;
  disabled?: boolean;
  onSelect: () => void;
  onDeselect: (index?: number) => void;
  onSlotChange: (slot: string | undefined, index?: number) => void;
  onPersonalChange: (isPersonal: boolean) => void;
  canSelectMultipleSessions?: boolean;
}

export const OrdinanceCard: React.FC<OrdinanceCardProps> = ({
  ordinance,
  selected,
  selectedSlot,
  selectedSessions,
  isPersonal = false,
  availableSlots,
  availability,
  slotAvailabilityMap,
  disabled = false,
  onSelect,
  onDeselect,
  onSlotChange,
  onPersonalChange,
  canSelectMultipleSessions = false,
}) => {
  const [openSlotKey, setOpenSlotKey] = useState<string | null>(null);

  const handleCardClick = () => {
    if (disabled) return;
    if (selected) {
      // If already selected, deselect (remove all sessions)
      onDeselect();
    } else {
      // Select if not selected (will initialize 3 sessions if canSelectMultipleSessions)
      onSelect();
    }
  };

  return (
    <div
      className={`
        relative flex flex-col p-4 rounded-2xl
        bg-white transition-all duration-200
        ${selected ? "ring-2 ring-primary border-primary" : "border border-gray-200 hover:border-gray-300"}
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
      `}
      onClick={handleCardClick}
    >
      <div className="flex w-full justify-between items-start gap-2 mb-3">
        <span
          className={`
            px-2.5 py-0.5 rounded-full text-xs font-medium
            ${selected ? "bg-primary text-white" : "bg-gray-50 text-gray-800"}
          `}
        >
          {availableSlots.length} {availableSlots.length === 1 ? "sessão" : "sessões"} disponíveis
        </span>
        <span
          className={`
            shrink-0 w-5 h-5 rounded-full flex items-center justify-center
            ${selected ? "bg-primary" : "border-2 border-gray-300"}
          `}
        >
          {selected && (
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          )}
        </span>
      </div>

      <span className="text-base font-semibold text-gray-900 mb-3">
        {ordinance.name}
      </span>

      {selected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-3 mt-2"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {canSelectMultipleSessions && selectedSessions ? (
            <>
              {selectedSessions.map((session, index) => {
                const usedSlots = selectedSessions
                  .filter((s, idx) => idx !== index && s.slot)
                  .map((s) => s.slot!);

                const availableSlotsForThis = availableSlots.filter(
                  (slot) => !usedSlots.includes(slot)
                );

                return (
                  <div key={index} className="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700">
                      Sessão {index + 1}
                    </label>
                    <Select
                      placeholder="Selecione o horário"
                      allowClear
                      disabled={disabled}
                      value={session.slot}
                      open={openSlotKey === `multi-${index}`}
                      onOpenChange={(open) => setOpenSlotKey(open ? `multi-${index}` : null)}
                      onSelect={() => setOpenSlotKey(null)}
                      onChange={(value) => onSlotChange(value, index)}
                      options={availableSlotsForThis.map((slot) => {
                        const slotAvailability = slotAvailabilityMap?.[slot];
                        const isSlotDisabled = slotAvailability
                          ? slotAvailability.available <= 0 && !slotAvailability.loading
                          : false;
                        return {
                          label: slot,
                          value: slot,
                          disabled: isSlotDisabled,
                        };
                      })}
                      className="w-full"
                    />
                    {session.slot && slotAvailabilityMap?.[session.slot] && (
                      <Tag color={slotAvailabilityMap[session.slot].available > 0 ? "green" : "red"}>
                        {slotAvailabilityMap[session.slot].available}/{slotAvailabilityMap[session.slot].maxCapacity} disponíveis
                      </Tag>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário
                </label>
                <Select
                  placeholder="Selecione o horário"
                  allowClear
                  disabled={disabled}
                  value={selectedSlot}
                  open={openSlotKey === "single"}
                  onOpenChange={(open) => setOpenSlotKey(open ? "single" : null)}
                  onSelect={() => setOpenSlotKey(null)}
                  onChange={(value) => onSlotChange(value)}
                  options={availableSlots.map((slot) => {
                    const slotAvailability = slotAvailabilityMap?.[slot];
                    const isSlotDisabled = slotAvailability
                      ? slotAvailability.available <= 0 && !slotAvailability.loading
                      : false;
                    return {
                      label: slot,
                      value: slot,
                      disabled: isSlotDisabled,
                    };
                  })}
                  className="w-full"
                />
              </div>

              {selectedSlot && availability && (
                <div>
                  {availability.loading ? (
                    <Tag>Carregando...</Tag>
                  ) : (
                    <Tag color={availability.available > 0 ? "green" : "red"}>
                      {availability.available}/{availability.maxCapacity} disponíveis
                    </Tag>
                  )}
                </div>
              )}

              {!ordinance.name.toLowerCase().includes("batistério") && (
                <Checkbox
                  disabled={disabled}
                  checked={isPersonal}
                  onChange={(e) => onPersonalChange(e.target.checked)}
                >
                  Se for uma ordenança pessoal, marque esta opção
                </Checkbox>
              )}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};

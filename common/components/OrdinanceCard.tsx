"use client";

import { OrdinanceWithId } from "@/features/ordinances/models/ordinances.model";
import { Checkbox, Select, Tag, Typography } from "antd";
import { motion } from "motion/react";
import React from "react";

export interface OrdinanceCardProps {
  ordinance: OrdinanceWithId;
  selected: boolean;
  selectedSlots: string[];
  isPersonal: boolean;
  availableSlots: string[];
  slotAvailabilityMap?: Record<
    string,
    { available: number; maxCapacity: number; loading: boolean }
  >;
  disabled?: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  onSlotsChange: (slots: string[]) => void;
  onPersonalChange: (isPersonal: boolean) => void;
}

const MAX_SESSIONS_PER_ORDINANCE = 3;

const { Text } = Typography;

export const OrdinanceCard: React.FC<OrdinanceCardProps> = ({
  ordinance,
  selected,
  selectedSlots,
  isPersonal,
  availableSlots,
  slotAvailabilityMap,
  disabled = false,
  onSelect,
  onDeselect,
  onSlotsChange,
  onPersonalChange,
}) => {
  const isBaptistry = ordinance.name.toLowerCase().includes("batistério");

  const handleCardClick = () => {
    if (disabled) return;
    if (selected) {
      onDeselect();
    } else {
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
          {availableSlots.length}{" "}
          {availableSlots.length === 1 ? "sessão" : "sessões"} disponíveis
        </span>
        <span
          className={`
            shrink-0 w-5 h-5 rounded-full flex items-center justify-center
            ${selected ? "bg-primary" : "border-2 border-gray-300"}
          `}
        >
          {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
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
          <div className="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg">
            <div className="flex flex-col gap-0.5">
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor={`ordinance-slots-${ordinance.id}`}
              >
                Horários
              </label>
              <Text type="secondary" className="text-xs block">
                Pode escolher até {MAX_SESSIONS_PER_ORDINANCE} sessões.
              </Text>
            </div>
            <Select
              id={`ordinance-slots-${ordinance.id}`}
              mode="multiple"
              placeholder="Selecione um ou mais horários"
              disabled={disabled}
              maxCount={MAX_SESSIONS_PER_ORDINANCE}
              value={selectedSlots}
              onChange={(value) => onSlotsChange(value as string[])}
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
            {selectedSlots.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedSlots.map((slot) => {
                  const slotAvailability = slotAvailabilityMap?.[slot];
                  if (!slotAvailability) return null;
                  return (
                    <Tag
                      key={`${ordinance.id}-${slot}`}
                      color={slotAvailability.available > 0 ? "green" : "red"}
                    >
                      {slot}: {slotAvailability.available}/{slotAvailability.maxCapacity}
                    </Tag>
                  );
                })}
              </div>
            )}
            {!isBaptistry && (
              <Checkbox
                disabled={disabled}
                checked={isPersonal}
                onChange={(e) => onPersonalChange(e.target.checked)}
              >
                Se for uma ordenança pessoal, marque esta opção
              </Checkbox>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

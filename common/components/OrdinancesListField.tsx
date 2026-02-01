"use client";

import { OrdinanceCardWrapper } from "@/common/components/OrdinanceCardWrapper";
import {
  OrdinanceFormValue,
  doTimeSlotsOverlap,
  filterAvailableOrdinances,
} from "@/common/utils/ordinances.utils";
import { OrdinanceWithId } from "@/features/ordinances/models/ordinances.model";
import { AgeCategory } from "@/features/registrations/models/registrations.model";
import { Form, FormInstance, Input } from "antd";
import React, { useEffect, useMemo } from "react";

interface FormValuesWithOrdinances {
  ordinances: OrdinanceFormValue[];
}

export interface OrdinancesListFieldProps {
  form: FormInstance<FormValuesWithOrdinances>;
  selectedCaravanId: string | null;
  gender: "M" | "F" | null;
  ordinances: OrdinanceWithId[];
  ageCategory: AgeCategory;
  isFirstTimeConvert: boolean;
  hasLessThanOneYearAsMember: boolean;
  ordinancesList: OrdinanceFormValue[];
  skipsOrdinances: boolean;
  disabled?: boolean;
}

export const OrdinancesListField: React.FC<OrdinancesListFieldProps> = ({
  form,
  selectedCaravanId,
  gender,
  ordinances,
  ageCategory,
  isFirstTimeConvert,
  hasLessThanOneYearAsMember,
  ordinancesList,
  skipsOrdinances,
  disabled = false,
}) => {
  // Filter available ordinances
  const availableOrdinances = useMemo(() => {
    return filterAvailableOrdinances(
      ordinances,
      gender,
      ageCategory,
      isFirstTimeConvert,
      hasLessThanOneYearAsMember
    );
  }, [ordinances, gender, ageCategory, isFirstTimeConvert, hasLessThanOneYearAsMember]);

  // Check if user can select multiple sessions of the same ordinance (only Batistério for YOUTH or members with less than 1 year)
  const canSelectMultipleSessions = useMemo(() => {
    return (
      (ageCategory === "YOUTH" || hasLessThanOneYearAsMember) &&
      availableOrdinances.length === 1 &&
      availableOrdinances[0]?.name.toLowerCase().includes("batistério")
    );
  }, [ageCategory, hasLessThanOneYearAsMember, availableOrdinances]);

  // Get selected ordinance IDs
  const selectedOrdinanceIds = useMemo(() => {
    return ordinancesList
      .filter((ord): ord is OrdinanceFormValue => ord != null && !!ord.ordinanceId)
      .map((ord) => ord.ordinanceId!);
  }, [ordinancesList]);

  // Get count of selected sessions for a specific ordinance
  const getSelectedSessionsCount = (ordinanceId: string) => {
    return ordinancesList.filter(
      (ord) => ord && ord.ordinanceId === ordinanceId && ord.slot
    ).length;
  };

  // Handle ordinance selection
  const handleSelectOrdinance = (ordinanceId: string) => {
    const currentOrdinances = form.getFieldValue("ordinances") || [];
    
    // If can select multiple sessions, initialize 3 sessions at once
    if (canSelectMultipleSessions) {
      const sessionsCount = getSelectedSessionsCount(ordinanceId);
      if (sessionsCount >= 3) {
        return;
      }
      // If not selected yet, add 3 sessions at once
      if (sessionsCount === 0) {
        const newOrdinances = [
          ...currentOrdinances,
          {
            ordinanceId,
            slot: undefined,
            isPersonal: false,
          },
          {
            ordinanceId,
            slot: undefined,
            isPersonal: false,
          },
          {
            ordinanceId,
            slot: undefined,
            isPersonal: false,
          },
        ];
        form.setFieldsValue({ ordinances: newOrdinances });
        return;
      }
    }

    // Original logic: Check if already selected
    if (selectedOrdinanceIds.includes(ordinanceId)) {
      return;
    }

    // Check maximum 3 ordinances
    if (currentOrdinances.filter((ord: OrdinanceFormValue) => ord && ord.ordinanceId).length >= 3) {
      return;
    }

    // Add new ordinance
    const newOrdinances = [
      ...currentOrdinances,
      {
        ordinanceId,
        slot: undefined,
        isPersonal: false,
      },
    ];
    form.setFieldsValue({ ordinances: newOrdinances });
  };

  // Handle ordinance deselection
  const handleDeselectOrdinance = (ordinanceId: string, index?: number) => {
    const currentOrdinances = form.getFieldValue("ordinances") || [];
    
    // If can select multiple sessions and index is provided, remove specific session
    if (canSelectMultipleSessions && index !== undefined) {
      const ordinanceIndices = currentOrdinances
        .map((ord: OrdinanceFormValue, idx: number) => 
          ord && ord.ordinanceId === ordinanceId ? idx : -1
        )
        .filter((idx: number) => idx >= 0);
      
      if (ordinanceIndices[index] !== undefined) {
        const newOrdinances = currentOrdinances.filter(
          (_: OrdinanceFormValue, idx: number) => idx !== ordinanceIndices[index]
        );
        form.setFieldsValue({ ordinances: newOrdinances });
        return;
      }
    }
    
    // Original logic: remove all sessions of this ordinance
    const newOrdinances = currentOrdinances.filter(
      (ord: OrdinanceFormValue) => ord && ord.ordinanceId !== ordinanceId
    );
    form.setFieldsValue({ ordinances: newOrdinances });
  };

  // Handle slot change
  const handleSlotChange = (ordinanceId: string, slot: string | undefined, index?: number) => {
    const currentOrdinances = form.getFieldValue("ordinances") || [];
    
    // If can select multiple sessions and index is provided, update specific session
    if (canSelectMultipleSessions && index !== undefined) {
      const ordinanceIndices = currentOrdinances
        .map((ord: OrdinanceFormValue, idx: number) => 
          ord && ord.ordinanceId === ordinanceId ? idx : -1
        )
        .filter((idx: number) => idx >= 0);
      
      if (ordinanceIndices[index] !== undefined) {
        const newOrdinances = [...currentOrdinances];
        newOrdinances[ordinanceIndices[index]] = {
          ...newOrdinances[ordinanceIndices[index]],
          slot,
        };
        form.setFieldsValue({ ordinances: newOrdinances });
        return;
      }
    }
    
    // Original logic: update first matching ordinance
    const newOrdinances = currentOrdinances.map((ord: OrdinanceFormValue) => {
      if (ord && ord.ordinanceId === ordinanceId) {
        return { ...ord, slot };
      }
      return ord;
    });
    form.setFieldsValue({ ordinances: newOrdinances });
  };

  // Handle personal change
  const handlePersonalChange = (ordinanceId: string, isPersonal: boolean) => {
    const currentOrdinances = form.getFieldValue("ordinances") || [];
    const newOrdinances = currentOrdinances.map((ord: OrdinanceFormValue) => {
      if (ord && ord.ordinanceId === ordinanceId) {
        return { ...ord, isPersonal };
      }
      return ord;
    });
    form.setFieldsValue({ ordinances: newOrdinances });
  };

  // Sync form fields with selected ordinances
  useEffect(() => {
    const currentOrdinances = form.getFieldValue("ordinances") || [];
    const currentIds = currentOrdinances
      .filter((ord: OrdinanceFormValue): ord is OrdinanceFormValue => ord != null)
      .map((ord: OrdinanceFormValue) => ord.ordinanceId)
      .filter(Boolean);
    
    // Check if sync is needed
    const idsMatch = 
      currentIds.length === selectedOrdinanceIds.length &&
      currentIds.every((id: string) => selectedOrdinanceIds.includes(id)) &&
      selectedOrdinanceIds.every((id) => currentIds.includes(id));
    
    if (idsMatch) return;
    
    // Remove ordinances that are no longer selected
    const toRemove: number[] = [];
    currentOrdinances.forEach((ord: OrdinanceFormValue, index: number) => {
      if (ord && ord.ordinanceId && !selectedOrdinanceIds.includes(ord.ordinanceId)) {
        toRemove.push(index);
      }
    });
    
    // Add newly selected ordinances
    const toAdd = selectedOrdinanceIds.filter((id) => !currentIds.includes(id));
    
    if (toRemove.length > 0 || toAdd.length > 0) {
      const newOrdinances = [...currentOrdinances];
      
      // Remove in reverse order to maintain indices
      toRemove.reverse().forEach((index) => {
        newOrdinances.splice(index, 1);
      });
      
      // Add new ordinances
      toAdd.forEach((id) => {
        newOrdinances.push({ ordinanceId: id, slot: undefined, isPersonal: false });
      });
      
      form.setFieldsValue({ ordinances: newOrdinances });
    }
  }, [selectedOrdinanceIds, form]);

  return (
    <Form.List
      name="ordinances"
      rules={[
        {
          validator: async (_, ordinancesList) => {
            const filledOrdinances = ordinancesList.filter(
              (o: OrdinanceFormValue): o is OrdinanceFormValue =>
                o != null && !!o.ordinanceId && !!o.slot
            );

            // If skips ordinances, no minimum required
            if (skipsOrdinances) {
              return Promise.resolve();
            }

            // Require at least 1 ordinance when not skipping
            if (filledOrdinances.length < 1) {
              return Promise.reject(
                new Error(
                  "Deve selecionar pelo menos uma ordenança ou marcar que não vai fazer ordenanças"
                )
              );
            }

            // Check maximum 3 ordinances
            if (filledOrdinances.length > 3) {
              return Promise.reject(
                new Error("Máximo 3 ordenanças podem ser selecionadas")
              );
            }

            // Check for overlapping time slots
            for (let i = 0; i < filledOrdinances.length; i++) {
              for (let j = i + 1; j < filledOrdinances.length; j++) {
                if (
                  filledOrdinances[i].slot &&
                  filledOrdinances[j].slot &&
                  doTimeSlotsOverlap(
                    filledOrdinances[i].slot!,
                    filledOrdinances[j].slot!
                  )
                ) {
                  return Promise.reject(
                    new Error(
                      "Os horários das ordenanças não podem se sobrepor"
                    )
                  );
                }
              }
            }
          },
        },
      ]}
    >
      {(fields) => {
        return (
            <div className="grid grid-cols-1 gap-4">
              {availableOrdinances.map((ordinance) => {
                // Get all selected sessions for this ordinance
                const selectedSessions = ordinancesList.filter(
                  (ord) => ord && ord.ordinanceId === ordinance.id
                );
                const sessionsCount = selectedSessions.length;
                const isSelected = sessionsCount > 0;

                // Get all field indices for this ordinance
                const fieldIndices = fields
                  .map((field, idx) => {
                    const fieldValue = form.getFieldValue(["ordinances", field.name, "ordinanceId"]);
                    return fieldValue === ordinance.id ? idx : -1;
                  })
                  .filter((idx) => idx >= 0);

                return (
                  <div key={ordinance.id}>
                    {fieldIndices.map((fieldIdx, sessionIdx) => (
                      <React.Fragment key={`${ordinance.id}-${fieldIdx}`}>
                        <Form.Item
                          name={[fields[fieldIdx].name, "ordinanceId"]}
                          hidden
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          name={[fields[fieldIdx].name, "slot"]}
                          hidden
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          name={[fields[fieldIdx].name, "isPersonal"]}
                          hidden
                        >
                          <Input />
                        </Form.Item>
                      </React.Fragment>
                    ))}
                    <OrdinanceCardWrapper
                      ordinance={ordinance}
                      selected={isSelected}
                      selectedOrdinance={selectedSessions[0]}
                      selectedSessions={canSelectMultipleSessions ? selectedSessions : undefined}
                      ordinancesList={ordinancesList}
                      selectedCaravanId={selectedCaravanId}
                      gender={gender}
                      disabled={
                        disabled ||
                        skipsOrdinances ||
                        (!isSelected &&
                          !canSelectMultipleSessions &&
                          selectedOrdinanceIds.length >= 3)
                      }
                      onSelect={() => handleSelectOrdinance(ordinance.id)}
                      onDeselect={(index) => handleDeselectOrdinance(ordinance.id, index)}
                      onSlotChange={(slot, index) => handleSlotChange(ordinance.id, slot, index)}
                      onPersonalChange={(isPersonal) =>
                        handlePersonalChange(ordinance.id, isPersonal)
                      }
                      canSelectMultipleSessions={canSelectMultipleSessions}
                    />
                  </div>
                );
              })}
            </div>
        );
      }}
    </Form.List>
  );
};

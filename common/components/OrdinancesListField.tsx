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

  // Get selected ordinance IDs
  const selectedOrdinanceIds = useMemo(() => {
    return ordinancesList
      .filter((ord): ord is OrdinanceFormValue => ord != null && !!ord.ordinanceId)
      .map((ord) => ord.ordinanceId!);
  }, [ordinancesList]);

  // Handle ordinance selection
  const handleSelectOrdinance = (ordinanceId: string) => {
    const currentOrdinances = form.getFieldValue("ordinances") || [];
    
    // Check if already selected
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
  const handleDeselectOrdinance = (ordinanceId: string) => {
    const currentOrdinances = form.getFieldValue("ordinances") || [];
    const newOrdinances = currentOrdinances.filter(
      (ord: OrdinanceFormValue) => ord && ord.ordinanceId !== ordinanceId
    );
    form.setFieldsValue({ ordinances: newOrdinances });
  };

  // Handle slot change
  const handleSlotChange = (ordinanceId: string, slot: string | undefined) => {
    const currentOrdinances = form.getFieldValue("ordinances") || [];
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
                const fieldIndex = fields.findIndex(
                  (field) => {
                    const fieldValue = form.getFieldValue(["ordinances", field.name, "ordinanceId"]);
                    return fieldValue === ordinance.id;
                  }
                );
                const selectedOrdinance = fieldIndex >= 0 
                  ? form.getFieldValue(["ordinances", fieldIndex])
                  : undefined;

                return (
                  <div key={ordinance.id}>
                    {fieldIndex >= 0 && (
                      <>
                        <Form.Item
                          name={[fields[fieldIndex].name, "ordinanceId"]}
                          hidden
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          name={[fields[fieldIndex].name, "slot"]}
                          hidden
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          name={[fields[fieldIndex].name, "isPersonal"]}
                          hidden
                        >
                          <Input />
                        </Form.Item>
                      </>
                    )}
                    <OrdinanceCardWrapper
                      ordinance={ordinance}
                      selected={selectedOrdinanceIds.includes(ordinance.id)}
                      selectedOrdinance={selectedOrdinance}
                      ordinancesList={ordinancesList}
                      selectedCaravanId={selectedCaravanId}
                      gender={gender}
                      disabled={disabled || (!selectedOrdinanceIds.includes(ordinance.id) && selectedOrdinanceIds.length >= 3)}
                      onSelect={() => handleSelectOrdinance(ordinance.id)}
                      onDeselect={() => handleDeselectOrdinance(ordinance.id)}
                      onSlotChange={(slot) => handleSlotChange(ordinance.id, slot)}
                      onPersonalChange={(isPersonal) =>
                        handlePersonalChange(ordinance.id, isPersonal)
                      }
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

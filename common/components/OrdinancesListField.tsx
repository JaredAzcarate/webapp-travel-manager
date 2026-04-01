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
import React, { useMemo } from "react";

interface FormValuesWithOrdinances {
  ordinances: OrdinanceFormValue[];
}

const MAX_SESSIONS_PER_ORDINANCE_TYPE = 3;
const MAX_DISTINCT_ORDINANCE_TYPES = 3;

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
  const availableOrdinances = useMemo(() => {
    return filterAvailableOrdinances(
      ordinances,
      gender,
      ageCategory,
      isFirstTimeConvert,
      hasLessThanOneYearAsMember
    );
  }, [ordinances, gender, ageCategory, isFirstTimeConvert, hasLessThanOneYearAsMember]);

  const uniqueOrdinanceTypeCount = useMemo(() => {
    const ids = new Set<string>();
    ordinancesList.forEach((o) => {
      if (o?.ordinanceId) ids.add(o.ordinanceId);
    });
    return ids.size;
  }, [ordinancesList]);

  const handleSelectOrdinance = (ordinanceId: string) => {
    const currentOrdinances = form.getFieldValue("ordinances") || [];
    const hasRowsForType = currentOrdinances.some(
      (ord: OrdinanceFormValue) => ord?.ordinanceId === ordinanceId
    );
    if (hasRowsForType) return;

    const uniqueTypes = new Set(
      currentOrdinances
        .filter((ord: OrdinanceFormValue) => ord?.ordinanceId)
        .map((ord: OrdinanceFormValue) => ord.ordinanceId!)
    );
    if (uniqueTypes.size >= MAX_DISTINCT_ORDINANCE_TYPES) return;

    form.setFieldsValue({
      ordinances: [
        ...currentOrdinances,
        { ordinanceId, slot: undefined, isPersonal: false },
      ],
    });
  };

  const handleDeselectOrdinance = (ordinanceId: string) => {
    const currentOrdinances = form.getFieldValue("ordinances") || [];
    form.setFieldsValue({
      ordinances: currentOrdinances.filter(
        (ord: OrdinanceFormValue) => ord?.ordinanceId !== ordinanceId
      ),
    });
  };

  const handleSlotsChange = (ordinanceId: string, slots: string[]) => {
    const currentOrdinances = form.getFieldValue("ordinances") || [];
    const previousRows = currentOrdinances.filter(
      (ord: OrdinanceFormValue) => ord?.ordinanceId === ordinanceId
    );
    const nextRows = slots.slice(0, MAX_SESSIONS_PER_ORDINANCE_TYPE).map((slot) => {
      const previousForSlot = previousRows.find((row) => row.slot === slot);
      return {
        ordinanceId,
        slot,
        isPersonal: previousForSlot?.isPersonal ?? false,
      };
    });

    form.setFieldsValue({
      ordinances: [
        ...currentOrdinances.filter(
          (ord: OrdinanceFormValue) => ord?.ordinanceId !== ordinanceId
        ),
        ...nextRows,
      ],
    });
  };

  const handlePersonalChange = (ordinanceId: string, isPersonal: boolean) => {
    const currentOrdinances = form.getFieldValue("ordinances") || [];
    form.setFieldsValue({
      ordinances: currentOrdinances.map((ord: OrdinanceFormValue) => {
        if (ord?.ordinanceId !== ordinanceId) return ord;
        return { ...ord, isPersonal };
      }),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Form.List
        name="ordinances"
        rules={[
          {
            validator: async (_, list: OrdinanceFormValue[]) => {
              const filledOrdinances = list.filter(
                (o: OrdinanceFormValue): o is OrdinanceFormValue =>
                  o != null && !!o.ordinanceId && !!o.slot
              );

              if (skipsOrdinances) {
                return Promise.resolve();
              }

              const byOrdCounts = new Map<string, number>();
              for (const o of filledOrdinances) {
                const id = o.ordinanceId!;
                byOrdCounts.set(id, (byOrdCounts.get(id) || 0) + 1);
              }

              if (byOrdCounts.size > MAX_DISTINCT_ORDINANCE_TYPES) {
                return Promise.reject(
                  new Error("Pode selecionar no máximo 3 tipos de ordenanças")
                );
              }

              for (const count of byOrdCounts.values()) {
                if (count > MAX_SESSIONS_PER_ORDINANCE_TYPE) {
                  return Promise.reject(
                    new Error("Cada ordenança pode ter no máximo 3 horários")
                  );
                }
              }

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
                      new Error("Os horários das ordenanças não podem se sobrepor")
                    );
                  }
                }
              }

              return Promise.resolve();
            },
          },
        ]}
      >
        {(fields) => {
          return (
            <div className="grid grid-cols-1 gap-4">
              {availableOrdinances.map((ordinance) => {
                const selectedSessions = ordinancesList.filter(
                  (ord) => ord && ord.ordinanceId === ordinance.id
                );
                const isSelected = selectedSessions.length > 0;

                const fieldIndicesIntoFields = fields
                  .map((field, idx) => {
                    const fieldValue = form.getFieldValue([
                      "ordinances",
                      field.name,
                      "ordinanceId",
                    ]);
                    return fieldValue === ordinance.id ? idx : -1;
                  })
                  .filter((idx) => idx >= 0);

                const disableNewOrdinanceType =
                  !isSelected &&
                  uniqueOrdinanceTypeCount >= MAX_DISTINCT_ORDINANCE_TYPES &&
                  !ordinancesList.some((o) => o?.ordinanceId === ordinance.id);

                return (
                  <div key={ordinance.id}>
                    {fieldIndicesIntoFields.map((fieldIdx) => (
                      <React.Fragment key={`${ordinance.id}-${fields[fieldIdx].key}`}>
                        <Form.Item
                          name={[fields[fieldIdx].name, "ordinanceId"]}
                          hidden
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item name={[fields[fieldIdx].name, "slot"]} hidden>
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
                      selectedSessions={selectedSessions}
                      ordinancesList={ordinancesList}
                      selectedCaravanId={selectedCaravanId}
                      gender={gender}
                      disabled={disabled || skipsOrdinances || disableNewOrdinanceType}
                      onSelect={() => handleSelectOrdinance(ordinance.id)}
                      onDeselect={() => handleDeselectOrdinance(ordinance.id)}
                      onSlotsChange={(slots) => handleSlotsChange(ordinance.id, slots)}
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
    </div>
  );
};

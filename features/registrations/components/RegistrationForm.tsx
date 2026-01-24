"use client";

import { CardRadioGroup } from "@/common/components/CardRadioGroup";
import { useBus } from "@/features/buses/hooks/buses.hooks";
import { useBusStops } from "@/features/buses/hooks/busStops.hooks";
import {
  useActiveCaravans,
  useCaravan,
} from "@/features/caravans/hooks/caravans.hooks";
import { useChapels } from "@/features/chapels/hooks/chapels.hooks";
import { useOrdinances } from "@/features/ordinances/hooks/ordinances.hooks";
import { OrdinanceWithId } from "@/features/ordinances/models/ordinances.model";
import {
  useCountActiveByBus,
  useCreateRegistration,
  useOrdinanceAvailabilityFromCaravan,
  useUpdateRegistration,
} from "@/features/registrations/hooks/registrations.hooks";
import {
  AgeCategory,
  CreateRegistrationInput,
  RegistrationWithId,
  UpdateRegistrationInput,
} from "@/features/registrations/models/registrations.model";
import { RegistrationRepository } from "@/features/registrations/repositories/registrations.repository";
import {
  Alert,
  App,
  Button,
  Checkbox,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  type FormListFieldData
} from "antd";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef } from "react";

const { Paragraph, Title } = Typography;

const sectionAnimation = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

function sectionTransition(delay = 0) {
  return { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const, delay };
}

interface OrdinanceFormValue {
  ordinanceId?: string;
  slot?: string;
}

interface FormValues {
  caravanId: string;
  chapelId: string;
  busId?: string;
  phone?: string;
  fullName: string;
  ageCategory: AgeCategory;
  gender: "M" | "F";
  isOfficiator?: boolean;
  legalGuardianName?: string;
  legalGuardianEmail?: string;
  legalGuardianPhone?: string;
  ordinances: OrdinanceFormValue[];
  isFirstTimeConvert: boolean;
  hasLessThanOneYearAsMember: boolean;
  isPersonalOrdinance: boolean;
  privacyPolicyAccepted: boolean;
}

interface OrdinanceFormItemProps {
  name: number;
  restField: Omit<FormListFieldData, "name" | "key">;
  form: ReturnType<typeof Form.useForm<FormValues>>[0];
  selectedCaravanId: string | null;
  gender: "M" | "F" | null;
  ordinances: OrdinanceWithId[];
  ageCategory: AgeCategory;
  isFirstTimeConvert: boolean;
  hasLessThanOneYearAsMember: boolean;
  selectedOrdinances: OrdinanceFormValue[];
  disabled?: boolean;
}

// Utility function to parse time slot (e.g., "9:30-10:00" -> { start: "9:30", end: "10:00" })
const parseTimeSlot = (slot: string): { start: string; end: string } | null => {
  const match = slot.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
  if (!match) return null;
  return { start: match[1], end: match[2] };
};

// Utility function to convert time to minutes for comparison
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Check if two time slots overlap
const doTimeSlotsOverlap = (
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

const OrdinanceFormItem: React.FC<OrdinanceFormItemProps> = ({
  name,
  restField,
  form,
  selectedCaravanId,
  gender,
  ordinances,
  ageCategory,
  isFirstTimeConvert,
  hasLessThanOneYearAsMember,
  selectedOrdinances,
  disabled = false,
}) => {
  const ordinanceId = Form.useWatch(
    ["ordinances", name, "ordinanceId"],
    form
  ) as string | null;
  const ordinanceSlot = Form.useWatch(["ordinances", name, "slot"], form);

  const {
    available,
    maxCapacity,
    loading: loadingAvailability,
  } = useOrdinanceAvailabilityFromCaravan(
    selectedCaravanId ?? null,
    ordinanceId ?? null,
    ordinanceSlot ?? null,
    gender
  );

  // Filter ordinances based on age category and restrictions
  const availableOrdinances = useMemo(() => {
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
  }, [ordinances, gender, ageCategory, isFirstTimeConvert, hasLessThanOneYearAsMember]);

  // Get available slots filtered by gender and non-overlapping with other selected ordinances
  const availableSlots = useMemo(() => {
    if (!ordinanceId) return [];

    const ordinance = ordinances.find((o) => o.id === ordinanceId);
    if (!ordinance) {
      return [];
    }

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
          if (!selected.slot || selected.ordinanceId === ordinanceId) return false;
          return doTimeSlotsOverlap(slot, selected.slot);
        });
      });
    }

    return availableSlotsList;
  }, [ordinanceId, gender, ordinances, selectedOrdinances]);

  return (
    <div className="mb-4">
      <div className="mb-2 text-sm font-medium">Ordenança {name + 1}</div>
      <Space
        style={{ display: "flex", marginBottom: 8 }}
        align="baseline"
        className="w-full"
      >
        <Form.Item {...restField} name={[name, "ordinanceId"]} className="flex-1">
          <Select
            placeholder="Selecione a ordenança"
            allowClear
            disabled={disabled}
            options={availableOrdinances.map((ordinance) => ({
              label: ordinance.name,
              value: ordinance.id,
            }))}
          />
        </Form.Item>

        <Form.Item {...restField} name={[name, "slot"]} className="flex-1">
          <Select
            placeholder="Selecione o horário"
            allowClear
            disabled={disabled || !ordinanceId}
            options={availableSlots.map((slot) => ({
              label: slot,
              value: slot,
            }))}
          />
        </Form.Item>

        {ordinanceId && ordinanceSlot && (
          <div className="w-32">
            {loadingAvailability ? (
              <Tag>Carregando...</Tag>
            ) : (
              <Tag color={available > 0 ? "green" : "red"}>
                {available}/{maxCapacity} disponíveis
              </Tag>
            )}
          </div>
        )}
      </Space>
    </div>
  );
};

// Component to handle ordinances list with proper hook usage
interface OrdinancesListFieldProps {
  form: ReturnType<typeof Form.useForm<FormValues>>[0];
  isPersonalOrdinance: boolean;
  selectedCaravanId: string | null;
  gender: "M" | "F" | null;
  ordinances: OrdinanceWithId[];
  ageCategory: AgeCategory;
  isFirstTimeConvert: boolean;
  hasLessThanOneYearAsMember: boolean;
  ordinancesList: OrdinanceFormValue[];
  disabled?: boolean;
}

const OrdinancesListField: React.FC<OrdinancesListFieldProps> = ({
  form,
  isPersonalOrdinance,
  selectedCaravanId,
  gender,
  ordinances,
  ageCategory,
  isFirstTimeConvert,
  hasLessThanOneYearAsMember,
  ordinancesList,
  disabled = false,
}) => {
  // Adjust fields when isPersonalOrdinance changes
  useEffect(() => {
    try {
      const currentOrdinances = form.getFieldValue("ordinances") || [];
      
      // Initialize if empty
      if (currentOrdinances.length === 0) {
        const initialCount = isPersonalOrdinance ? 1 : 3;
        const initialOrdinances = Array.from({ length: initialCount }, () => ({
          ordinanceId: undefined,
          slot: undefined,
        }));
        form.setFieldsValue({
          ordinances: initialOrdinances,
        });
        return;
      }
      
      if (isPersonalOrdinance && currentOrdinances.length > 1) {
        // Keep only the first ordinance
        form.setFieldsValue({
          ordinances: [currentOrdinances[0] || { ordinanceId: undefined, slot: undefined }],
        });
      } else if (!isPersonalOrdinance) {
        if (currentOrdinances.length < 3) {
          // Add empty fields up to 3
          const newOrdinances = [...currentOrdinances];
          while (newOrdinances.length < 3) {
            newOrdinances.push({ ordinanceId: undefined, slot: undefined });
          }
          form.setFieldsValue({
            ordinances: newOrdinances,
          });
        } else if (currentOrdinances.length > 3) {
          // Keep only first 3
          form.setFieldsValue({
            ordinances: currentOrdinances.slice(0, 3),
          });
        }
      }
    } catch (error) {
      console.error("Error adjusting ordinances fields:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPersonalOrdinance]);

  return (
    <Form.List
      name="ordinances"
      rules={[
        {
          validator: async (_, ordinancesList) => {
            const filledOrdinances = ordinancesList.filter(
              (o: OrdinanceFormValue) => o.ordinanceId && o.slot
            );

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
        const maxFields = isPersonalOrdinance ? 1 : 3;
        const displayFields = fields.slice(0, maxFields);

        return (
          <>
            <div className="mb-2">
              <span className="text-sm font-medium">
                Ordenanças{" "}
                {isPersonalOrdinance
                  ? "(máximo 1)"
                  : "(máximo 3, opcional)"}
              </span>
            </div>

            {displayFields.map(({ key, name, ...restField }) => (
              <OrdinanceFormItem
                key={key}
                name={name}
                restField={restField}
                form={form}
                selectedCaravanId={selectedCaravanId}
                gender={gender}
                ordinances={ordinances}
                ageCategory={ageCategory}
                isFirstTimeConvert={isFirstTimeConvert}
                hasLessThanOneYearAsMember={hasLessThanOneYearAsMember}
                selectedOrdinances={ordinancesList.filter(
                  (o: OrdinanceFormValue, idx: number) =>
                    idx !== name && o.ordinanceId && o.slot
                )}
                disabled={disabled}
              />
            ))}
          </>
        );
      }}
    </Form.List>
  );
};

interface RegistrationFormProps {
  mode: "create" | "edit";
  registrationId?: string;
  initialRegistrationData?: RegistrationWithId;
  caravanId?: string;
  onSuccess?: () => void;
}

const repository = new RegistrationRepository();

export const RegistrationForm = ({
  mode,
  registrationId,
  initialRegistrationData,
  caravanId: propCaravanId,
  onSuccess,
}: RegistrationFormProps) => {
  const { notification } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<FormValues>();
  const hasShownSuccessRef = useRef(false);
  const hasShownErrorRef = useRef(false);

  const {
    createRegistration,
    isPending: isCreating,
    isSuccess: created,
    error: createError,
  } = useCreateRegistration();

  const {
    updateRegistration,
    isPending: isUpdating,
    isSuccess: updated,
    error: updateError,
  } = useUpdateRegistration();

  const { caravans: activeCaravans, loading: loadingCaravans } =
    useActiveCaravans();
  const { chapels, loading: loadingChapels } = useChapels();
  const { busStops } = useBusStops();
  const { ordinances } = useOrdinances();

  const selectedCaravanId = Form.useWatch("caravanId", form);
  const selectedChapelId = Form.useWatch("chapelId", form);
  const ordinancesList = Form.useWatch("ordinances", form) || [];
  const ageCategory = Form.useWatch("ageCategory", form);
  const gender = Form.useWatch("gender", form);
  const isFirstTimeConvert = Form.useWatch("isFirstTimeConvert", form);
  const hasLessThanOneYearAsMember = Form.useWatch(
    "hasLessThanOneYearAsMember",
    form
  );
  const isPersonalOrdinance = Form.useWatch("isPersonalOrdinance", form);

  const { caravan: selectedCaravan } = useCaravan(selectedCaravanId || "");

  const assignedBusId = useMemo(() => {
    if (!selectedChapelId || !selectedCaravan || !busStops.length) return null;

    const stopsForChapel = busStops.filter(
      (stop) => stop.chapelId === selectedChapelId
    );

    if (stopsForChapel.length === 0) return null;

    const validStops = stopsForChapel
      .filter((stop) => selectedCaravan.busIds.includes(stop.busId))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (validStops.length === 0) return null;

    return validStops[0].busId;
  }, [selectedChapelId, selectedCaravan, busStops]);

  const { bus: assignedBus } = useBus(assignedBusId || "");
  const { count: occupiedCount } = useCountActiveByBus(
    selectedCaravanId || "",
    assignedBusId || ""
  );

  const capacityInfo = useMemo(() => {
    if (!assignedBus || !selectedCaravanId || !assignedBusId) return null;
    const available = assignedBus.capacity - occupiedCount;
    const isFull = occupiedCount >= assignedBus.capacity;
    return {
      occupied: occupiedCount,
      capacity: assignedBus.capacity,
      available,
      isFull,
      busName: assignedBus.name,
    };
  }, [assignedBus, occupiedCount, selectedCaravanId, assignedBusId]);

  const busAssignmentMessage = useMemo(() => {
    if (!selectedChapelId) return null;

    if (!assignedBusId) {
      return {
        type: "warning" as const,
        message: "Atenção: Nesta viagem não foi programada uma paragem na sua unidade, por favor selecione outra unidade.",
        available: false,
      };
    }

    if (capacityInfo?.isFull) {
      return {
        type: "warning" as const,
        message:
          "O autocarro que passará pela sua unidade não tem mais vagas. No entanto, o seu nome entrará na lista de espera",
        available: true,
      };
    }

    if (capacityInfo && assignedBus) {
      return {
        type: "info" as const,
        message: `Importante: Ainda há ${capacityInfo.available} vagas disponíveis no autocarro.`,
        available: true,
      };
    }

    return null;
  }, [selectedChapelId, assignedBusId, capacityInfo, assignedBus]);

  const isBusAvailable = useMemo(() => {
    // If no chapel is selected, form should be disabled
    if (!selectedChapelId) return false;
    
    // Use busAssignmentMessage.available if it exists
    if (busAssignmentMessage) {
      return busAssignmentMessage.available ?? false;
    }
    
    // If there's no assigned bus, bus is not available
    if (!assignedBusId) return false;
    
    // If capacity info is not loaded yet but bus is assigned, assume available
    if (!capacityInfo) return true;
    
    // Bus is available if there's capacity or if it's full but still allows waitlist
    return true;
  }, [selectedChapelId, assignedBusId, capacityInfo, busAssignmentMessage]);

  const prevHasLessThanOneYearAsMember = useRef(hasLessThanOneYearAsMember);
  useEffect(() => {
    if (
      prevHasLessThanOneYearAsMember.current === true &&
      hasLessThanOneYearAsMember === false
    ) {
      form.setFieldsValue({ isFirstTimeConvert: false });
    }
    prevHasLessThanOneYearAsMember.current = hasLessThanOneYearAsMember;
  }, [hasLessThanOneYearAsMember, form]);

  const prevChapelIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (
      prevChapelIdRef.current !== undefined &&
      selectedChapelId !== undefined &&
      prevChapelIdRef.current !== selectedChapelId
    ) {
      const caravanId = form.getFieldValue("caravanId");
      form.resetFields();
      form.setFieldsValue({
        caravanId,
        chapelId: selectedChapelId,
        ageCategory: undefined,
        isOfficiator: false,
        isFirstTimeConvert: false,
        hasLessThanOneYearAsMember: false,
        isPersonalOrdinance: false,
        privacyPolicyAccepted: false,
        ordinances: [],
      });
    }
    prevChapelIdRef.current = selectedChapelId;
  }, [selectedChapelId, form]);

  // Initialize form values
  useEffect(() => {
    if (mode === "edit" && initialRegistrationData) {
      const existingOrdinances =
        initialRegistrationData.ordinances &&
        Array.isArray(initialRegistrationData.ordinances)
          ? initialRegistrationData.ordinances
          : [];

      const ordinancesData = existingOrdinances
        .filter((ord) => ord.ordinanceId && ord.slot)
        .map((ord) => ({
          ordinanceId: ord.ordinanceId!,
          slot: ord.slot!,
        }));

      // Migrate ageCategory if needed
      let ageCategoryValue: AgeCategory = initialRegistrationData.ageCategory;
      const registrationData = initialRegistrationData as RegistrationWithId & { isAdult?: boolean };
      if (!ageCategoryValue && registrationData.isAdult !== undefined) {
        ageCategoryValue = registrationData.isAdult ? "ADULT" : "YOUTH";
      }

      form.setFieldsValue({
        caravanId: initialRegistrationData.caravanId,
        chapelId: initialRegistrationData.chapelId,
        busId: initialRegistrationData.busId,
        phone: initialRegistrationData.phone,
        fullName: initialRegistrationData.fullName,
        ageCategory: ageCategoryValue,
        gender: initialRegistrationData.gender,
        isOfficiator: initialRegistrationData.isOfficiator,
        legalGuardianName: initialRegistrationData.legalGuardianName,
        legalGuardianEmail: initialRegistrationData.legalGuardianEmail,
        legalGuardianPhone: initialRegistrationData.legalGuardianPhone,
        ordinances: ordinancesData,
        isFirstTimeConvert: initialRegistrationData.isFirstTimeConvert,
        hasLessThanOneYearAsMember: false,
        isPersonalOrdinance: false,
        privacyPolicyAccepted: initialRegistrationData.privacyPolicyAccepted ?? false,
      });
    }
  }, [mode, initialRegistrationData, form]);

  useEffect(() => {
    if (mode === "create" && propCaravanId) {
      form.setFieldsValue({
        caravanId: propCaravanId,
        ordinances: [],
        isPersonalOrdinance: false,
      });
    }
  }, [mode, propCaravanId, form]);

  useEffect(() => {
    if (mode === "create" && assignedBusId && selectedChapelId) {
      form.setFieldsValue({ busId: assignedBusId });
    }
  }, [assignedBusId, selectedChapelId, form, mode]);

  // Clear guardian fields when age category changes
  useEffect(() => {
    if (ageCategory === "ADULT" && mode === "create") {
      form.setFieldsValue({
        legalGuardianName: undefined,
        legalGuardianEmail: undefined,
        legalGuardianPhone: undefined,
      });
    }
  }, [ageCategory, form, mode]);

  useEffect(() => {
    if (mode === "create" && created && !hasShownSuccessRef.current) {
      hasShownSuccessRef.current = true;
      notification.success({
        title: "Sucesso",
        description: "A inscrição foi criada com sucesso",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        // Reset form only if onSuccess is not provided
        form.resetFields();
        if (propCaravanId) {
          form.setFieldsValue({
            caravanId: propCaravanId,
            ordinances: [],
            isPersonalOrdinance: false,
          });
        }
      }
    }
    if (!created && !isCreating) {
      hasShownSuccessRef.current = false;
    }
  }, [mode, created, isCreating, form, notification, onSuccess, propCaravanId]);

  useEffect(() => {
    if (mode === "edit" && updated && !hasShownSuccessRef.current) {
      hasShownSuccessRef.current = true;
      notification.success({
        title: "Sucesso",
        description: "A inscrição foi atualizada com sucesso",
      });
      if (onSuccess) {
        onSuccess();
      }
    }
    if (!updated && !isUpdating) {
      hasShownSuccessRef.current = false;
    }
  }, [mode, updated, isUpdating, notification, onSuccess]);

  useEffect(() => {
    if (mode === "create" && createError && !hasShownErrorRef.current) {
      hasShownErrorRef.current = true;
      const errorMessage =
        createError instanceof Error
          ? createError.message
          : "Erro desconhecido";
      notification.error({
        title: "Erro",
        description: `Não foi possível criar a inscrição: ${errorMessage}`,
      });
    }
    if (!createError && !isCreating) {
      hasShownErrorRef.current = false;
    }
  }, [mode, createError, isCreating, notification]);

  useEffect(() => {
    if (mode === "edit" && updateError && !hasShownErrorRef.current) {
      hasShownErrorRef.current = true;
      const errorMessage =
        updateError instanceof Error
          ? updateError.message
          : "Erro desconhecido";
      notification.error({
        title: "Erro",
        description: `Não foi possível atualizar a inscrição: ${errorMessage}`,
      });
    }
    if (!updateError && !isUpdating) {
      hasShownErrorRef.current = false;
    }
  }, [mode, updateError, isUpdating, notification]);

  const handleSubmit = async (values: FormValues) => {
    let finalBusId = values.busId;

    if (mode === "create" && !finalBusId && selectedChapelId && selectedCaravanId) {
      const caravan = activeCaravans.find((c) => c.id === selectedCaravanId);
      if (caravan && busStops.length > 0) {
        const stopsForChapel = busStops.filter(
          (stop) => stop.chapelId === selectedChapelId
        );

        if (stopsForChapel.length > 0) {
          const validStops = stopsForChapel
            .filter((stop) => caravan.busIds.includes(stop.busId))
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          if (validStops.length > 0) {
            finalBusId = validStops[0].busId;
            values.busId = finalBusId;
            form.setFieldsValue({ busId: finalBusId });
          }
        }
      }
    }

    if (mode === "create" && !finalBusId && assignedBusId) {
      finalBusId = assignedBusId;
      values.busId = assignedBusId;
      form.setFieldsValue({ busId: assignedBusId });
    }

    if (mode === "create" && !finalBusId) {
      notification.error({
        title: "Erro",
        description:
          "Não foi possível atribuir um autocarro. Por favor, verifique se há um autocarro disponível para a sua capela.",
      });
      return;
    }

    if (mode === "create") {
      const paymentStatus: "PENDING" | "FREE" = values.isFirstTimeConvert
        ? "FREE"
        : "PENDING";

      const input: CreateRegistrationInput = {
        caravanId: values.caravanId || selectedCaravanId || propCaravanId || "",
        chapelId: values.chapelId || selectedChapelId || "",
        busId: finalBusId || values.busId || "",
        phone: values.phone || "",
        fullName: values.fullName,
        ageCategory: values.ageCategory,
        gender: values.gender,
        isOfficiator: values.isOfficiator ?? false,
        ...(values.legalGuardianName && {
          legalGuardianName: values.legalGuardianName,
        }),
        ...(values.legalGuardianEmail && {
          legalGuardianEmail: values.legalGuardianEmail,
        }),
        ...(values.legalGuardianPhone && {
          legalGuardianPhone: values.legalGuardianPhone,
        }),
        ordinances: (values.ordinances || [])
          .filter((ord) => ord.ordinanceId && ord.slot)
          .map((ord) => ({
            ordinanceId: ord.ordinanceId!,
            slot: ord.slot!,
          })),
        isFirstTimeConvert: values.isFirstTimeConvert ?? false,
        paymentStatus,
        participationStatus: "ACTIVE",
        privacyPolicyAccepted: values.privacyPolicyAccepted,
      };

      createRegistration(input);
    } else if (mode === "edit" && registrationId) {
      const input: UpdateRegistrationInput = {
        caravanId: values.caravanId,
        chapelId: values.chapelId,
        busId: values.busId,
        phone: values.phone || "",
        fullName: values.fullName,
        ageCategory: values.ageCategory,
        gender: values.gender,
        isOfficiator: values.isOfficiator ?? false,
        ...(values.legalGuardianName && {
          legalGuardianName: values.legalGuardianName,
        }),
        ...(values.legalGuardianEmail && {
          legalGuardianEmail: values.legalGuardianEmail,
        }),
        ...(values.legalGuardianPhone && {
          legalGuardianPhone: values.legalGuardianPhone,
        }),
        ordinances: (values.ordinances || [])
          .filter((ord) => ord.ordinanceId && ord.slot)
          .map((ord) => ({
            ordinanceId: ord.ordinanceId!,
            slot: ord.slot!,
          })),
        isFirstTimeConvert: values.isFirstTimeConvert ?? false,
        privacyPolicyAccepted: values.privacyPolicyAccepted,
      };
      updateRegistration(registrationId, input);
    }
  };

  const isPending = mode === "create" ? isCreating : isUpdating;

  // Determine which sections to show based on age category
  const shouldShowOrdinancesStep = ageCategory !== "CHILD";

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      style={{ width: "100%" }}
      initialValues={{
        ageCategory: undefined,
        isOfficiator: false,
        isFirstTimeConvert: false,
        hasLessThanOneYearAsMember: false,
        isPersonalOrdinance: false,
        privacyPolicyAccepted: false,
        ordinances: [],
      }}
    >
      {/* Section 1: Initial Information */}
      <motion.div
        className="mb-8 bg-white p-4 rounded-2xl flex flex-col gap-4"
        initial={sectionAnimation.initial}
        animate={sectionAnimation.animate}
        transition={sectionTransition(0)}
      >
        <Title level={4} className="mb-4">
          Informações Iniciais
        </Title>
        {mode === "create" && propCaravanId && (
          <Form.Item
            name="caravanId"
            label="Caravana"
            rules={[
              {
                required: true,
                message: "Por favor, selecione uma caravana",
              },
            ]}
            hidden
          >
            <Input />
          </Form.Item>
        )}

        {mode === "edit" && (
          <Form.Item
            name="caravanId"
            label="Caravana"
            rules={[
              {
                required: true,
                message: "Por favor, selecione uma caravana",
              },
            ]}
          >
            <Select
              placeholder="Selecione uma caravana"
              loading={loadingCaravans}
              disabled={!isBusAvailable}
              options={activeCaravans.map((caravan) => ({
                label: caravan.name,
                value: caravan.id,
              }))}
            />
          </Form.Item>
        )}

        <Form.Item
          name="chapelId"
          label="Qual é a unidade do participante?"
          rules={[
            { required: true, message: "Por favor, selecione uma capela" },
          ]}
        >
          <Select
            placeholder="Selecione uma capela"
            loading={loadingChapels}
            options={chapels.map((chapel) => ({
              label: chapel.name,
              value: chapel.id,
            }))}
          />
        </Form.Item>

        <AnimatePresence>
          {busAssignmentMessage && (
            <motion.div
              key="bus-assignment-alert"
              initial={sectionAnimation.initial}
              animate={sectionAnimation.animate}
              exit={sectionAnimation.exit}
              transition={sectionTransition(0)}
            >
              <Alert
                title={busAssignmentMessage.message}
                type={busAssignmentMessage.type}
                showIcon
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={
            !isBusAvailable
              ? "opacity-50 transition-all pointer-events-none flex flex-col gap-4"
              : "flex flex-col gap-4"
          }
        >
          {mode === "create" && (
            <Form.Item name="busId" hidden>
              <Input />
            </Form.Item>
          )}

          <Form.Item
            name="ageCategory"
            label="Qual é a idade do participante?"
            rules={[
              {
                required: true,
                message: "Por favor, selecione a categoria de idade",
              },
            ]}
          >
            <CardRadioGroup
              options={[
                { value: "CHILD", tag: "1-10 anos", primary: "Criança" },
                { value: "YOUTH", tag: "11-17 anos", primary: "Jovem" },
                { value: "ADULT", tag: "+18 anos", primary: "Adulto" },
              ]}
              disabled={!isBusAvailable}
            />
          </Form.Item>

          <AnimatePresence>
            {(ageCategory === "YOUTH" || ageCategory === "ADULT") && (
              <motion.div
                key="youth-adult-switches"
                initial={sectionAnimation.initial}
                animate={sectionAnimation.animate}
                exit={sectionAnimation.exit}
                transition={sectionTransition(0)}
                className="flex flex-col gap-4"
              >
                <Form.Item
                  name="hasLessThanOneYearAsMember"
                  valuePropName="checked"
                >
                  <Checkbox disabled={!isBusAvailable}>O participante tem menos de 1 ano como membro</Checkbox>
                </Form.Item>
                {hasLessThanOneYearAsMember && (
                  <motion.div
                    key="is-first-time-convert"
                    initial={sectionAnimation.initial}
                    animate={sectionAnimation.animate}
                    exit={sectionAnimation.exit}
                    transition={sectionTransition(0)}
                    className="p-4 rounded-2xl bg-white border border-gray-200 flex flex-col sm:flex-row justify-between"
                  >
                   <div>
                      <Title level={5}>É primeira vez que vai fazer uma ordenança no templo?</Title>
                      <Paragraph>A estaca Porto Norte oferece uma viagem gratuita para <strong>membros recem conversos que fazem a sua primeira ordenança no templo.</strong> Por favor, marque a opção &quot;sim&quot; se esse for o caso.</Paragraph>
                    </div>

                    <Form.Item
                      name="isFirstTimeConvert"
                      valuePropName="checked"
                    >
                      <Switch
                        disabled={!isBusAvailable}
                        checkedChildren="Sim"
                        unCheckedChildren="Não"
                      />
                    </Form.Item>

                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Section 2: Personal Information */}
      <motion.div
        className={`mb-8 p-4 bg-white rounded-2xl flex flex-col gap-4 transition-all
          ${!isBusAvailable
            ? "opacity-30 pointer-events-none"
            : "opacity-100"
        }`}
        initial={sectionAnimation.initial}
        animate={sectionAnimation.animate}
        transition={sectionTransition(0.06)}
      >
        <Title level={4} className="mb-4">
          Dados Pessoais
        </Title>
        <div className="flex flex-col md:flex-row gap-4">
        <Form.Item
          name="fullName"
          label="Nome Completo do participante"
          rules={[
            {
              required: true,
              message: "Por favor, insira o nome completo",
            },
          ]}
          className="flex-1"
        >
          <Input placeholder="Ex: João Silva" disabled={!isBusAvailable} />
        </Form.Item>

        <AnimatePresence>
          {ageCategory === "ADULT" && (
            <motion.div
              key="adult-phone"
              initial={sectionAnimation.initial}
              animate={sectionAnimation.animate}
              exit={sectionAnimation.exit}
              transition={sectionTransition(0)}
              className="flex-1"
            >
              <Form.Item
                name="phone"
                label="Número de Telefone do participante"
                rules={[
                  {
                    required: true,
                    message: "Por favor, insira o número de telefone",
                  },
                  {
                    pattern: /^\+?[1-9]\d{1,14}$/,
                    message: "Por favor, insira um número de telefone válido",
                  },
                  {
                    validator: async (_, value) => {
                      if (!value || mode !== "create" || !selectedCaravanId) {
                        return Promise.resolve();
                      }
                      const isUnique = await repository.checkPhoneUniqueness(
                        value,
                        selectedCaravanId
                      );
                      if (!isUnique) {
                        return Promise.reject(
                          new Error(
                            "Este número de telefone já está registrado nesta caravana"
                          )
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input
                  placeholder="Ex: +351912345678"
                  disabled={!isBusAvailable}
                />
              </Form.Item>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
        <Form.Item
          name="gender"
          label="Sexo"
          rules={[{ required: true, message: "Por favor, selecione o sexo" }]}
        >
          <Radio.Group disabled={!isBusAvailable}>
            <Radio value="M">Masculino</Radio>
            <Radio value="F">Feminino</Radio>
          </Radio.Group>
        </Form.Item>

        <AnimatePresence>
          {(ageCategory === "CHILD" || ageCategory === "YOUTH") && (
            <>
            <motion.div
              key="legal-guardian"
              initial={sectionAnimation.initial}
              animate={sectionAnimation.animate}
              exit={sectionAnimation.exit}
              transition={sectionTransition(0)}
              className="flex flex-col gap-4 border-t border-gray-200 pt-4"
            >
              <div className="flex flex-col ">
              <Title level={5}>Responsável Legal do Participante</Title>
              <Paragraph>Todos os participantes menores de 18 anos devem ter um responsável legal. Alem disso, o responsável legal deve assinar o formulário de autorização médica e permissão dos pais/responsáveis.</Paragraph>
              </div>
              <Form.Item
                name="legalGuardianName"
                label="Nome do completo do responsável legal"
                rules={[
                  {
                    required: true,
                    message: "Por favor, insira o nome do responsável legal",
                  },
                ]}
              >
                <Input
                  placeholder="Ex: Maria Silva"
                  disabled={!isBusAvailable}
                />
              </Form.Item>

              <div className="flex flex-col md:flex-row gap-4">
              <Form.Item
                name="legalGuardianEmail"
                label="Email do responsável legal"
                rules={[
                  {
                    type: "email",
                    message: "Por favor, insira um email válido",
                  },
                ]}
                className="flex-1"
              >
                <Input
                  placeholder="Ex: maria@exemplo.pt"
                  disabled={!isBusAvailable}
                />
              </Form.Item>

              <Form.Item
                name="legalGuardianPhone"
                label="Telefone do responsável legal"
                rules={[
                  {
                    pattern: /^\+?[1-9]\d{1,14}$/,
                    message: "Por favor, insira um número de telefone válido",
                  },
                ]}
                className="flex-1"
              >
                <Input
                  placeholder="Ex: +351912345678"
                  disabled={!isBusAvailable}
                />
              </Form.Item>
              </div>
            </motion.div>

            <motion.div
              key="medical-release-form"
              initial={sectionAnimation.initial}
              animate={sectionAnimation.animate}
              exit={sectionAnimation.exit}
              transition={sectionTransition(0)}
            >
            <Alert
            title="Formulário de Autorização Médica"
            description={
              <div>
                <Paragraph>
                  Por favor, descarregue e complete o formulário de autorização
                  médica e permissão dos pais/responsáveis. Este formulário
                  deve ser entregue completo no dia da viagem.
                </Paragraph>

                <Button type="primary" href="/documents/2017_parental_or_guardian_permission_medical_release.pdf" target="_blank">Descarregar formulário PDF</Button>
              </div>
            }
            type="info"
            showIcon
          />
          </motion.div>
          </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {ageCategory === "ADULT" &&
            !isFirstTimeConvert &&
            !hasLessThanOneYearAsMember && (
              <motion.div
                key="is-officiator"
                initial={sectionAnimation.initial}
                animate={sectionAnimation.animate}
                exit={sectionAnimation.exit}
                transition={sectionTransition(0)}
              >
                <Form.Item
                  name="isOfficiator"
                  label="És oficiante?"
                  valuePropName="checked"
                >
                  <Switch disabled={!isBusAvailable} />
                </Form.Item>
              </motion.div>
            )}
        </AnimatePresence>
      </motion.div>

      {/* Section 3: Ordinances */}
      <AnimatePresence>
        {shouldShowOrdinancesStep && (
          <motion.div
            key="ordinances-section"
            className={
              !isBusAvailable
                ? "mb-8 bg-white p-4 rounded-2xl opacity-50 transition-all pointer-events-none"
                : "mb-8 bg-white p-4 rounded-2xl"
            }
            initial={sectionAnimation.initial}
            animate={sectionAnimation.animate}
            exit={sectionAnimation.exit}
            transition={sectionTransition(0.12)}
          >
            <Title level={4} className="mb-4">
              Ordenanças
            </Title>
            <Form.Item
              name="isPersonalOrdinance"
              label="É uma ordenança personal?"
              valuePropName="checked"
            >
              <Checkbox disabled={!isBusAvailable}>
                É uma ordenança personal?
              </Checkbox>
            </Form.Item>

            <OrdinancesListField
              form={form}
              isPersonalOrdinance={isPersonalOrdinance}
              selectedCaravanId={selectedCaravanId}
              gender={gender}
              ordinances={ordinances}
              ageCategory={ageCategory || "ADULT"}
              isFirstTimeConvert={isFirstTimeConvert}
              hasLessThanOneYearAsMember={hasLessThanOneYearAsMember}
              ordinancesList={ordinancesList}
              disabled={!isBusAvailable}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 4: Privacy Policy */}
      <motion.div
        className={
          !isBusAvailable ? "mb-8 opacity-50 transition-all pointer-events-none" : "mb-8"
        }
        initial={sectionAnimation.initial}
        animate={sectionAnimation.animate}
        transition={sectionTransition(0.18)}
      >
        <Title level={4} className="mb-4">
          Políticas de Privacidade
        </Title>
        <Paragraph>
          Ao aceitar esta política de privacidade, você concorda com o uso dos
          dados registrados para fins de gestão da caravana ao templo. Este
          sistema não é oficial da Igreja de Jesus Cristo dos Santos dos
          Últimos Dias.
        </Paragraph>

        <Form.Item
          name="privacyPolicyAccepted"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) => {
                if (!value) {
                  return Promise.reject(
                    new Error(
                      "Deve aceitar a política de privacidade para continuar"
                    )
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Checkbox disabled={!isBusAvailable}>
            Aceito a política de privacidade e autorizo o uso dos meus dados
            para fins de gestão da caravana
          </Checkbox>
        </Form.Item>
      </motion.div>

      <Form.Item>
        <motion.div
          className={
            !isBusAvailable ? "flex flex-col gap-3 opacity-50 transition-all" : "flex flex-col gap-3"
          }
          initial={sectionAnimation.initial}
          animate={sectionAnimation.animate}
          transition={sectionTransition(0.24)}
        >
          <Button
            size="large"
            type="primary"
            htmlType="submit"
            loading={isPending}
            disabled={!isBusAvailable}
            className="w-full"
          >
            {isPending
              ? mode === "create"
                ? "A inscrever..."
                : "A atualizar..."
              : mode === "create"
              ? "Me inscrever"
              : "Atualizar inscrição"}
          </Button>

          <Button
            size="large"
            onClick={() => router.back()}
            className="w-full"
          >
            Cancelar
          </Button>
        </motion.div>
      </Form.Item>
    </Form>
  );
};

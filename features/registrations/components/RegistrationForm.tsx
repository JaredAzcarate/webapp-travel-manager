"use client";

import {
  ORDINANCE_NAMES,
  ORDINANCE_SLOTS,
} from "@/common/constants/ordinances";
import { useBus, useBuses } from "@/features/buses/hooks/buses.hooks";
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
  CreateRegistrationInput,
  OrdinanceType,
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
} from "antd";
import { useRouter } from "next/navigation";
import { Check, X } from "phosphor-react";
import React, { useEffect, useMemo, useRef } from "react";

interface OrdinanceFormValue {
  type?: OrdinanceType;
  slot?: string;
  isPersonal?: boolean;
}

interface FormValues {
  caravanId: string;
  chapelId: string;
  busId?: string;
  phone: string;
  fullName: string;
  isMinor: boolean;
  gender: "M" | "F";
  isOfficiator: boolean;
  legalGuardianName?: string;
  legalGuardianEmail?: string;
  legalGuardianPhone?: string;
  ordinances: OrdinanceFormValue[];
  isFirstTimeConvert: boolean;
}

interface OrdinanceFormItemProps {
  name: number;
  restField: any;
  form: any;
  selectedCaravanId: string | null;
  gender: "M" | "F" | null;
  ordinances: OrdinanceWithId[];
  isMinor?: boolean;
}

const OrdinanceFormItem: React.FC<OrdinanceFormItemProps> = ({
  name,
  restField,
  form,
  selectedCaravanId,
  gender,
  ordinances,
  isMinor = false,
}) => {
  const ordinanceType = Form.useWatch(
    ["ordinances", name, "type"],
    form
  ) as OrdinanceType | null;
  const ordinanceSlot = Form.useWatch(["ordinances", name, "slot"], form);

  const {
    available,
    maxCapacity,
    loading: loadingAvailability,
  } = useOrdinanceAvailabilityFromCaravan(
    selectedCaravanId,
    ordinanceType,
    ordinanceSlot,
    gender
  );

  // Get available slots filtered by gender
  const availableSlots = useMemo(() => {
    if (!ordinanceType) return [];

    // Find ordinance by type
    const ordinance = ordinances.find((o) => o.type === ordinanceType);
    if (!ordinance) {
      // Fallback to constants if ordinance not found
      return ORDINANCE_SLOTS[ordinanceType] || [];
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

    return Array.from(slotSet);
  }, [ordinanceType, gender, ordinances]);

  return (
    <div className="mb-4">
      <div className="mb-2 text-sm font-medium">Ordenança {name + 1}</div>
      <Space
        style={{ display: "flex", marginBottom: 8 }}
        align="baseline"
        className="w-full"
      >
        <Form.Item {...restField} name={[name, "type"]} className="flex-1">
          <Select
            placeholder="Selecione a ordenança"
            allowClear
            options={
              isMinor
                ? Object.entries(ORDINANCE_NAMES)
                    .filter(([type]) => type === "BAPTISTRY")
                    .map(([type, name]) => ({
                      label: name,
                      value: type,
                    }))
                : Object.entries(ORDINANCE_NAMES).map(([type, name]) => ({
                    label: name,
                    value: type,
                  }))
            }
          />
        </Form.Item>

        <Form.Item {...restField} name={[name, "slot"]} className="flex-1">
          <Select
            placeholder="Selecione o horário"
            allowClear
            disabled={!ordinanceType}
            options={availableSlots.map((slot) => ({
              label: slot,
              value: slot,
            }))}
          />
        </Form.Item>

        {ordinanceType && ordinanceSlot && (
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
      <Form.Item
        {...restField}
        name={[name, "isPersonal"]}
        valuePropName="checked"
        className="mt-2"
      >
        <Checkbox>É uma ordenança personal?</Checkbox>
      </Form.Item>
    </div>
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
  const { buses, loading: loadingBuses } = useBuses();
  const { busStops, loading: loadingBusStops } = useBusStops();
  const { ordinances, loading: loadingOrdinances } = useOrdinances();

  const selectedCaravanId = Form.useWatch("caravanId", form);
  const selectedChapelId = Form.useWatch("chapelId", form);
  const ordinancesList = Form.useWatch("ordinances", form) || [];
  const isMinor = Form.useWatch("isMinor", form);
  const gender = Form.useWatch("gender", form);

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

  const availableBuses = useMemo(() => {
    if (!selectedCaravan) return buses;
    return buses.filter((bus) => selectedCaravan.busIds.includes(bus.id));
  }, [buses, selectedCaravan]);

  useEffect(() => {
    console.log("=== useEffect busId assignment ===");
    console.log("mode:", mode);
    console.log("assignedBusId:", assignedBusId);
    console.log("selectedChapelId:", selectedChapelId);

    if (mode === "create" && assignedBusId && selectedChapelId) {
      console.log("Setting busId in form:", assignedBusId);
      form.setFieldsValue({ busId: assignedBusId });
    } else {
      console.log("NOT setting busId - conditions not met");
    }
  }, [assignedBusId, selectedChapelId, form, mode]);

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
        message: "Nesta caravana não foi programada uma parada pela sua capela",
      };
    }

    if (capacityInfo?.isFull) {
      return {
        type: "warning" as const,
        message:
          "O autocarro que passará pela sua capela está cheio. No entanto, o seu nome entrará na lista de espera",
      };
    }

    if (capacityInfo && assignedBus) {
      return {
        type: "info" as const,
        message: `Autocarro atribuído: ${assignedBus.name} (${capacityInfo.available} lugares disponíveis)`,
      };
    }

    return null;
  }, [selectedChapelId, assignedBusId, capacityInfo, assignedBus]);

  useEffect(() => {
    if (mode === "edit" && initialRegistrationData) {
      const existingOrdinances =
        initialRegistrationData.ordinances &&
        Array.isArray(initialRegistrationData.ordinances)
          ? initialRegistrationData.ordinances
          : [];

      const ordinancesData = existingOrdinances
        .filter((ord) => ord.type && ord.slot)
        .map((ord) => ({
          type: ord.type!,
          slot: ord.slot!,
          isPersonal: ord.isPersonal ?? false,
        }));

      while (ordinancesData.length < 3) {
        ordinancesData.push({
          type: undefined as any,
          slot: undefined as any,
          isPersonal: false,
        });
      }

      form.setFieldsValue({
        caravanId: initialRegistrationData.caravanId,
        chapelId: initialRegistrationData.chapelId,
        busId: initialRegistrationData.busId,
        phone: initialRegistrationData.phone,
        fullName: initialRegistrationData.fullName,
        isMinor: !initialRegistrationData.isAdult,
        gender: initialRegistrationData.gender,
        isOfficiator: initialRegistrationData.isOfficiator,
        legalGuardianName: initialRegistrationData.legalGuardianName,
        legalGuardianEmail: initialRegistrationData.legalGuardianEmail,
        legalGuardianPhone: initialRegistrationData.legalGuardianPhone,
        ordinances: ordinancesData,
        isFirstTimeConvert: initialRegistrationData.isFirstTimeConvert,
      });
    }
  }, [mode, initialRegistrationData, propCaravanId, form]);

  useEffect(() => {
    if (mode === "create" && propCaravanId) {
      form.setFieldsValue({
        caravanId: propCaravanId,
        ordinances: [
          { type: undefined, slot: undefined, isPersonal: false },
          { type: undefined, slot: undefined, isPersonal: false },
          { type: undefined, slot: undefined, isPersonal: false },
        ],
      });
    }
  }, [mode, initialRegistrationData, propCaravanId, form]);

  useEffect(() => {
    if (mode === "create" && created && !hasShownSuccessRef.current) {
      hasShownSuccessRef.current = true;
      notification.success({
        title: "Sucesso",
        description: "A inscrição foi criada com sucesso",
      });
      if (onSuccess) {
        onSuccess();
      }
      form.resetFields();
      if (propCaravanId) {
        form.setFieldsValue({
          caravanId: propCaravanId,
          ordinances: [
            { type: undefined, slot: undefined, isPersonal: false },
            { type: undefined, slot: undefined, isPersonal: false },
            { type: undefined, slot: undefined, isPersonal: false },
          ],
        });
      }
    }
    // Reset ref when mutation is no longer successful (e.g., new mutation started)
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
    // Reset ref when mutation is no longer successful
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
    // Reset ref when error is cleared
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
    // Reset ref when error is cleared
    if (!updateError && !isUpdating) {
      hasShownErrorRef.current = false;
    }
  }, [mode, updateError, isUpdating, notification]);

  useEffect(() => {
    if (!isMinor && mode === "create") {
      form.setFieldsValue({
        legalGuardianName: undefined,
        legalGuardianEmail: undefined,
        legalGuardianPhone: undefined,
      });
    }
  }, [isMinor, form, mode]);

  const handleSubmit = async (values: FormValues) => {
    console.log("=== handleSubmit DEBUG ===");
    console.log("Mode:", mode);
    console.log("values.busId (initial):", values.busId);
    console.log("values.chapelId:", values.chapelId);
    console.log("values.caravanId:", values.caravanId);

    // Read current form values to ensure we have the latest data
    const currentFormValues = form.getFieldsValue();
    console.log("currentFormValues:", currentFormValues);

    // Use values from form if not in values parameter
    const chapelId = values.chapelId || currentFormValues.chapelId;
    const caravanId =
      values.caravanId || currentFormValues.caravanId || propCaravanId;

    console.log("chapelId (final):", chapelId);
    console.log("caravanId (final):", caravanId);
    console.log("assignedBusId (from hook):", assignedBusId);
    console.log("selectedChapelId (from hook):", selectedChapelId);
    console.log("selectedCaravanId (from hook):", selectedCaravanId);

    // If busId is not set, try to calculate it from chapelId
    let finalBusId = values.busId;

    if (mode === "create" && !finalBusId && chapelId && caravanId) {
      // Recalculate assignedBusId if we have chapelId and caravanId
      const caravan = activeCaravans.find((c) => c.id === caravanId);
      if (caravan && busStops.length > 0) {
        const stopsForChapel = busStops.filter(
          (stop) => stop.chapelId === chapelId
        );

        if (stopsForChapel.length > 0) {
          const validStops = stopsForChapel
            .filter((stop) => caravan.busIds.includes(stop.busId))
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          if (validStops.length > 0) {
            finalBusId = validStops[0].busId;
            console.log("Calculated busId from chapelId:", finalBusId);
            values.busId = finalBusId;
            form.setFieldsValue({ busId: finalBusId });
          }
        }
      }
    }

    // Fallback to assignedBusId from hook if still not set
    if (mode === "create" && !finalBusId && assignedBusId) {
      console.log("Setting busId from assignedBusId hook:", assignedBusId);
      finalBusId = assignedBusId;
      values.busId = assignedBusId;
      form.setFieldsValue({ busId: assignedBusId });
    }

    console.log("values.busId (after assignment):", values.busId);
    console.log("finalBusId:", finalBusId);

    // In create mode, busId is required (even if bus is full, we need it for waitlist)
    if (mode === "create" && !finalBusId) {
      console.error("ERROR: busId is missing!");
      console.error("chapelId:", chapelId);
      console.error("caravanId:", caravanId);
      console.error("busStops length:", busStops.length);
      notification.error({
        title: "Erro",
        description:
          "Não foi possível atribuir um autocarro. Por favor, verifique se há um autocarro disponível para a sua capela.",
      });
      return;
    }

    // Ensure values.busId is set
    if (mode === "create" && finalBusId) {
      values.busId = finalBusId;
    }

    if (mode === "create") {
      const paymentStatus: "PENDING" | "FREE" = values.isFirstTimeConvert
        ? "FREE"
        : "PENDING";

      const input: CreateRegistrationInput = {
        caravanId: values.caravanId || caravanId || propCaravanId || "",
        chapelId: values.chapelId || chapelId || "",
        busId: finalBusId || values.busId || "",
        phone: values.phone,
        fullName: values.fullName,
        isAdult: !values.isMinor,
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
          .filter((ord) => ord.type && ord.slot)
          .map((ord) => ({
            type: ord.type!,
            slot: ord.slot!,
            isPersonal: ord.isPersonal ?? false,
          })),
        isFirstTimeConvert: values.isFirstTimeConvert ?? false,
        paymentStatus,
        participationStatus: "ACTIVE", // El repository lo cambiará a WAITLIST si el autocar está lleno
      };

      console.log("=== PAYLOAD TO CREATE REGISTRATION ===");
      console.log("Input payload:", JSON.stringify(input, null, 2));
      console.log("=====================================");

      createRegistration(input);
    } else if (mode === "edit" && registrationId) {
      const input: UpdateRegistrationInput = {
        caravanId: values.caravanId,
        chapelId: values.chapelId,
        busId: values.busId,
        phone: values.phone,
        fullName: values.fullName,
        isAdult: !values.isMinor,
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
          .filter((ord) => ord.type && ord.slot)
          .map((ord) => ({
            type: ord.type!,
            slot: ord.slot!,
            isPersonal: ord.isPersonal ?? false,
          })),
        isFirstTimeConvert: values.isFirstTimeConvert ?? false,
      };
      updateRegistration(registrationId, input);
    }
  };

  const isPending = mode === "create" ? isCreating : isUpdating;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      style={{ width: "100%" }}
      initialValues={{
        isMinor: false,
        isOfficiator: false,
        isFirstTimeConvert: false,
        ordinances: [
          { type: undefined, slot: undefined, isPersonal: false },
          { type: undefined, slot: undefined, isPersonal: false },
          { type: undefined, slot: undefined, isPersonal: false },
        ],
      }}
    >
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
            options={activeCaravans.map((caravan) => ({
              label: caravan.name,
              value: caravan.id,
            }))}
          />
        </Form.Item>
      )}

      <Form.Item
        name="chapelId"
        label="Capela de Partida"
        rules={[{ required: true, message: "Por favor, selecione uma capela" }]}
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

      {busAssignmentMessage && (
        <Alert
          title={busAssignmentMessage.message}
          type={busAssignmentMessage.type}
          showIcon
          className="mb-4"
        />
      )}

      {mode === "create" && (
        <Form.Item name="busId" hidden>
          <Input />
        </Form.Item>
      )}

      <div className="flex gap-4">
        <Form.Item
          name="fullName"
          label="Nome Completo"
          rules={[
            {
              required: true,
              message: "Por favor, insira o nome completo",
            },
          ]}
          className="flex-1"
        >
          <Input placeholder="Ex: João Silva" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Número de Telefone"
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
          className="flex-1"
        >
          <Input placeholder="Ex: +351912345678" />
        </Form.Item>
      </div>

      <Form.Item name="isMinor" valuePropName="checked">
        <Checkbox>Esta inscrição é de um jovem menor de idade</Checkbox>
      </Form.Item>

      <Form.Item
        name="gender"
        label="Sexo"
        rules={[{ required: true, message: "Por favor, selecione o sexo" }]}
      >
        <Radio.Group>
          <Radio value="M">Masculino</Radio>
          <Radio value="F">Feminino</Radio>
        </Radio.Group>
      </Form.Item>

      {isMinor && (
        <>
          <Form.Item
            name="legalGuardianName"
            label="Nome do Responsável Legal"
            rules={[
              {
                required: isMinor,
                message: "Por favor, insira o nome do responsável legal",
              },
            ]}
          >
            <Input placeholder="Ex: Maria Silva" />
          </Form.Item>

          <Form.Item
            name="legalGuardianEmail"
            label="Email do Responsável Legal"
            rules={[
              {
                type: "email",
                message: "Por favor, insira um email válido",
              },
            ]}
          >
            <Input placeholder="Ex: maria@exemplo.pt" />
          </Form.Item>

          <Form.Item
            name="legalGuardianPhone"
            label="Telefone do Responsável Legal"
            rules={[
              {
                pattern: /^\+?[1-9]\d{1,14}$/,
                message: "Por favor, insira um número de telefone válido",
              },
            ]}
          >
            <Input placeholder="Ex: +351912345678" />
          </Form.Item>
        </>
      )}

      <Form.Item
        name="isOfficiator"
        label="És oficiante?"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.List
        name="ordinances"
        rules={[
          {
            validator: async (_, ordinances) => {
              if (ordinances && ordinances.length > 3) {
                return Promise.reject(
                  new Error("Máximo de 3 ordenanças permitidas")
                );
              }

              const filledOrdinances = ordinances.filter(
                (o: OrdinanceFormValue) => o.type && o.slot
              );
              const unique = new Set(
                filledOrdinances.map(
                  (o: OrdinanceFormValue) => `${o.type}-${o.slot}`
                )
              );
              if (unique.size !== filledOrdinances.length) {
                return Promise.reject(
                  new Error(
                    "Não é possível selecionar a mesma ordenança duas vezes"
                  )
                );
              }
            },
          },
        ]}
      >
        {(fields) => (
          <>
            <div className="mb-2">
              <span className="text-sm font-medium">Ordenanças (opcional)</span>
            </div>

            {fields.map(({ key, name, ...restField }) => (
              <OrdinanceFormItem
                key={key}
                name={name}
                restField={restField}
                form={form}
                selectedCaravanId={selectedCaravanId}
                gender={gender}
                ordinances={ordinances}
                isMinor={isMinor}
              />
            ))}
          </>
        )}
      </Form.List>

      <Form.Item
        name="isFirstTimeConvert"
        label="É a sua primeira vez no templo como recém-converso?"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item>
        <div className="flex gap-5">
          <Button icon={<X size={16} />} onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            type="primary"
            icon={<Check size={16} />}
            htmlType="submit"
            loading={isPending}
          >
            {isPending
              ? mode === "create"
                ? "A criar..."
                : "A atualizar..."
              : mode === "create"
              ? "Criar"
              : "Atualizar"}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

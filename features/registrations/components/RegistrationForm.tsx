"use client";

import { useBuses } from "@/features/buses/hooks/buses.hooks";
import {
  useActiveCaravans,
  useCaravan,
} from "@/features/caravans/hooks/caravans.hooks";
import { useChapels } from "@/features/chapels/hooks/chapels.hooks";
import {
  useCreateRegistration,
  useUpdateRegistration,
} from "@/features/registrations/hooks/registrations.hooks";
import {
  CreateRegistrationInput,
  OrdinanceType,
  RegistrationWithId,
  UpdateRegistrationInput,
} from "@/features/registrations/models/registrations.model";
import { App, Button, Form, Input, Radio, Select, Switch } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

interface FormValues {
  caravanId: string;
  chapelId: string;
  busId: string;
  phone: string;
  fullName: string;
  isAdult: boolean;
  gender: "M" | "F";
  isOfficiator: boolean;
  legalGuardianName?: string;
  legalGuardianEmail?: string;
  legalGuardianPhone?: string;
  ordinanceType: OrdinanceType;
  ordinanceSlot: string;
  isFirstTimeConvert: boolean;
}

const ORDINANCE_SLOTS: Record<OrdinanceType, string[]> = {
  INITIATORY: [
    "9:30-10:00",
    "10:00-10:30",
    "10:30-11:00",
    "14:00-14:30",
    "14:30-15:00",
    "15:00-15:30",
    "15:30-16:00",
  ],
  BAPTISTRY: ["9:30-11:00", "11:00-12:30", "14:00-15:30"],
  ENDOWMENT: [
    "9:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
  ],
  SEALING: ["10:00-11:00", "11:00-12:00", "15:00-16:00", "16:00-17:00"],
};

interface RegistrationFormProps {
  mode: "create" | "edit";
  registrationId?: string;
  initialRegistrationData?: RegistrationWithId;
  onSuccess?: () => void;
}

export const RegistrationForm = ({
  mode,
  registrationId,
  initialRegistrationData,
  onSuccess,
}: RegistrationFormProps) => {
  const { notification } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<FormValues>();

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

  const selectedCaravanId = Form.useWatch("caravanId", form);
  const selectedOrdinanceType = Form.useWatch("ordinanceType", form);
  const isAdult = Form.useWatch("isAdult", form);

  const { caravan: selectedCaravan } = useCaravan(selectedCaravanId || "");

  const availableBuses = useMemo(() => {
    if (!selectedCaravan) return buses;
    return buses.filter((bus) => selectedCaravan.busIds.includes(bus.id));
  }, [buses, selectedCaravan]);

  const availableSlots = useMemo(() => {
    if (!selectedOrdinanceType) return [];
    return ORDINANCE_SLOTS[selectedOrdinanceType] || [];
  }, [selectedOrdinanceType]);

  useEffect(() => {
    if (mode === "edit" && initialRegistrationData) {
      form.setFieldsValue({
        caravanId: initialRegistrationData.caravanId,
        chapelId: initialRegistrationData.chapelId,
        busId: initialRegistrationData.busId,
        phone: initialRegistrationData.phone,
        fullName: initialRegistrationData.fullName,
        isAdult: initialRegistrationData.isAdult,
        gender: initialRegistrationData.gender,
        isOfficiator: initialRegistrationData.isOfficiator,
        legalGuardianName: initialRegistrationData.legalGuardianName,
        legalGuardianEmail: initialRegistrationData.legalGuardianEmail,
        legalGuardianPhone: initialRegistrationData.legalGuardianPhone,
        ordinanceType: initialRegistrationData.ordinanceType,
        ordinanceSlot: initialRegistrationData.ordinanceSlot,
        isFirstTimeConvert: initialRegistrationData.isFirstTimeConvert,
      });
    }
  }, [mode, initialRegistrationData, form]);

  useEffect(() => {
    if (mode === "create" && created) {
      notification.success({
        title: "Sucesso",
        description: "A inscrição foi criada com sucesso",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/registrations");
      }
      form.resetFields();
    }
  }, [mode, created, form, notification, onSuccess, router]);

  useEffect(() => {
    if (mode === "edit" && updated) {
      notification.success({
        title: "Sucesso",
        description: "A inscrição foi atualizada com sucesso",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/registrations");
      }
    }
  }, [mode, updated, notification, onSuccess, router]);

  useEffect(() => {
    if (mode === "create" && createError) {
      const errorMessage =
        createError instanceof Error
          ? createError.message
          : "Erro desconhecido";
      notification.error({
        title: "Erro",
        description: `Não foi possível criar a inscrição: ${errorMessage}`,
      });
    }
  }, [mode, createError, notification]);

  useEffect(() => {
    if (mode === "edit" && updateError) {
      const errorMessage =
        updateError instanceof Error
          ? updateError.message
          : "Erro desconhecido";
      notification.error({
        title: "Erro",
        description: `Não foi possível atualizar a inscrição: ${errorMessage}`,
      });
    }
  }, [mode, updateError, notification]);

  useEffect(() => {
    if (
      selectedOrdinanceType &&
      availableSlots.length > 0 &&
      mode === "create"
    ) {
      form.setFieldsValue({ ordinanceSlot: availableSlots[0] });
    }
  }, [selectedOrdinanceType, availableSlots, form, mode]);

  useEffect(() => {
    if (!isAdult && mode === "create") {
      form.setFieldsValue({
        legalGuardianName: undefined,
        legalGuardianEmail: undefined,
        legalGuardianPhone: undefined,
      });
    }
  }, [isAdult, form, mode]);

  const handleSubmit = (values: FormValues) => {
    if (mode === "create") {
      const paymentStatus: "PENDING" | "FREE" = values.isFirstTimeConvert
        ? "FREE"
        : "PENDING";

      const input: CreateRegistrationInput = {
        caravanId: values.caravanId,
        chapelId: values.chapelId,
        busId: values.busId,
        phone: values.phone,
        fullName: values.fullName,
        isAdult: values.isAdult,
        gender: values.gender,
        isOfficiator: values.isOfficiator,
        legalGuardianName: values.legalGuardianName,
        legalGuardianEmail: values.legalGuardianEmail,
        legalGuardianPhone: values.legalGuardianPhone,
        ordinanceType: values.ordinanceType,
        ordinanceSlot: values.ordinanceSlot,
        isFirstTimeConvert: values.isFirstTimeConvert,
        paymentStatus,
        participationStatus: "ACTIVE",
      };
      createRegistration(input);
    } else if (mode === "edit" && registrationId) {
      const input: UpdateRegistrationInput = {
        caravanId: values.caravanId,
        chapelId: values.chapelId,
        busId: values.busId,
        phone: values.phone,
        fullName: values.fullName,
        isAdult: values.isAdult,
        gender: values.gender,
        isOfficiator: values.isOfficiator,
        legalGuardianName: values.legalGuardianName,
        legalGuardianEmail: values.legalGuardianEmail,
        legalGuardianPhone: values.legalGuardianPhone,
        ordinanceType: values.ordinanceType,
        ordinanceSlot: values.ordinanceSlot,
        isFirstTimeConvert: values.isFirstTimeConvert,
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
    >
      <Form.Item
        name="caravanId"
        label="Caravana"
        rules={[
          { required: true, message: "Por favor, selecione uma caravana" },
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

      <Form.Item
        name="busId"
        label="Autocarro"
        rules={[
          { required: true, message: "Por favor, selecione um autocarro" },
        ]}
      >
        <Select
          placeholder="Selecione um autocarro"
          loading={loadingBuses}
          disabled={!selectedCaravanId}
          options={availableBuses.map((bus) => ({
            label: `${bus.name} (Capacidade: ${bus.capacity})`,
            value: bus.id,
          }))}
        />
      </Form.Item>

      <Form.Item
        name="fullName"
        label="Nome Completo"
        rules={[
          { required: true, message: "Por favor, insira o nome completo" },
        ]}
      >
        <Input placeholder="Ex: João Silva" />
      </Form.Item>

      <Form.Item
        name="phone"
        label="Número de Telefone"
        rules={[
          { required: true, message: "Por favor, insira o número de telefone" },
          {
            pattern: /^\+?[1-9]\d{1,14}$/,
            message: "Por favor, insira um número de telefone válido",
          },
        ]}
      >
        <Input placeholder="Ex: +351912345678" />
      </Form.Item>

      <Form.Item
        name="isAdult"
        label="És adulto ou jovem?"
        rules={[{ required: true, message: "Por favor, selecione uma opção" }]}
        valuePropName="checked"
      >
        <Switch checkedChildren="Adulto" unCheckedChildren="Jovem" />
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

      <Form.Item
        name="isOfficiator"
        label="És oficiante?"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      {!isAdult && (
        <>
          <Form.Item
            name="legalGuardianName"
            label="Nome do Responsável Legal"
            rules={[
              {
                required: !isAdult,
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
        name="ordinanceType"
        label="Tipo de Ordenança"
        rules={[
          {
            required: true,
            message: "Por favor, selecione o tipo de ordenança",
          },
        ]}
      >
        <Select placeholder="Selecione o tipo de ordenança">
          <Select.Option value="BAPTISTRY">Batistério</Select.Option>
          <Select.Option value="INITIATORY">Iniciatória</Select.Option>
          <Select.Option value="ENDOWMENT">Investidura</Select.Option>
          <Select.Option value="SEALING">Selamento</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="ordinanceSlot"
        label="Horário"
        rules={[{ required: true, message: "Por favor, selecione um horário" }]}
      >
        <Select
          placeholder="Selecione um horário"
          disabled={!selectedOrdinanceType}
          options={availableSlots.map((slot) => ({
            label: slot,
            value: slot,
          }))}
        />
      </Form.Item>

      <Form.Item
        name="isFirstTimeConvert"
        label="É a sua primeira vez no templo como recém-converso?"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item>
        <div className="flex gap-2">
          <Button onClick={() => router.back()}>Cancelar</Button>
          <Button type="primary" htmlType="submit" loading={isPending}>
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


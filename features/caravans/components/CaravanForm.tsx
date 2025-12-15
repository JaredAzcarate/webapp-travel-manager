"use client";

import {
  useCreateCaravan,
  useUpdateCaravan,
} from "@/features/caravans/hooks/caravans.hooks";
import {
  CaravanWithId,
  CreateCaravanInput,
  UpdateCaravanInput,
} from "@/features/caravans/models/caravans.model";
import { App, Button, DatePicker, Form, Input, Switch } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface FormValues {
  name: string;
  templeName?: string;
  departureAt: Dayjs;
  returnAt: Dayjs;
  formOpenAt: Dayjs;
  formCloseAt: Dayjs;
  isActive: boolean;
  busIds?: string[];
}

interface CaravanFormProps {
  mode: "create" | "edit";
  caravanId?: string;
  initialCaravanData?: CaravanWithId;
  onSuccess?: () => void;
}

export const CaravanForm = ({
  mode,
  caravanId,
  initialCaravanData,
  onSuccess,
}: CaravanFormProps) => {
  const { notification } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<FormValues>();

  const {
    createCaravan,
    isPending: isCreating,
    isSuccess: created,
    error: createError,
  } = useCreateCaravan();

  const {
    updateCaravan,
    isPending: isUpdating,
    isSuccess: updated,
    error: updateError,
  } = useUpdateCaravan();

  useEffect(() => {
    if (mode === "edit" && initialCaravanData) {
      form.setFieldsValue({
        name: initialCaravanData.name,
        templeName: initialCaravanData.templeName,
        departureAt: initialCaravanData.departureAt
          ? dayjs(initialCaravanData.departureAt.toDate())
          : undefined,
        returnAt: initialCaravanData.returnAt
          ? dayjs(initialCaravanData.returnAt.toDate())
          : undefined,
        formOpenAt: initialCaravanData.formOpenAt
          ? dayjs(initialCaravanData.formOpenAt.toDate())
          : undefined,
        formCloseAt: initialCaravanData.formCloseAt
          ? dayjs(initialCaravanData.formCloseAt.toDate())
          : undefined,
        isActive: initialCaravanData.isActive ?? false,
        busIds: initialCaravanData.busIds ?? [],
      });
    }
  }, [mode, initialCaravanData, form]);

  useEffect(() => {
    if (mode === "create" && created) {
      notification.success({
        title: "Sucesso",
        description: "A caravana foi criada com sucesso",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/caravans");
      }
      form.resetFields();
    }
  }, [mode, created, form, notification, onSuccess, router]);

  useEffect(() => {
    if (mode === "edit" && updated) {
      notification.success({
        title: "Sucesso",
        description: "A caravana foi atualizada com sucesso",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/caravans");
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
        description: `Não foi possível criar a caravana: ${errorMessage}`,
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
        description: `Não foi possível atualizar a caravana: ${errorMessage}`,
      });
    }
  }, [mode, updateError, notification]);

  const handleSubmit = (values: FormValues) => {
    const convertToTimestamp = (dayjsValue: Dayjs): Timestamp => {
      return Timestamp.fromDate(dayjsValue.toDate());
    };

    if (mode === "create") {
      const input: CreateCaravanInput = {
        name: values.name,
        templeName: values.templeName,
        departureAt: convertToTimestamp(values.departureAt),
        returnAt: convertToTimestamp(values.returnAt),
        formOpenAt: convertToTimestamp(values.formOpenAt),
        formCloseAt: convertToTimestamp(values.formCloseAt),
        isActive: values.isActive ?? false,
        busIds: values.busIds ?? [],
      };
      createCaravan(input);
    } else if (mode === "edit" && caravanId) {
      const input: UpdateCaravanInput = {
        name: values.name,
        templeName: values.templeName,
        departureAt: convertToTimestamp(values.departureAt),
        returnAt: convertToTimestamp(values.returnAt),
        formOpenAt: convertToTimestamp(values.formOpenAt),
        formCloseAt: convertToTimestamp(values.formCloseAt),
        isActive: values.isActive ?? false,
        busIds: values.busIds ?? [],
      };
      updateCaravan(caravanId, input);
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
        isActive: false,
        busIds: [],
      }}
    >
      <Form.Item
        name="name"
        label="Nome da Caravana"
        rules={[
          { required: true, message: "Por favor, insira o nome da caravana" },
        ]}
      >
        <Input placeholder="Ex: Caravana de Março 2025" />
      </Form.Item>

      <Form.Item name="templeName" label="Nome do Templo">
        <Input placeholder="Ex: Templo de Lisboa" />
      </Form.Item>

      <Form.Item
        name="departureAt"
        label="Data e Hora de Partida"
        rules={[
          {
            required: true,
            message: "Por favor, selecione a data e hora de partida",
          },
        ]}
      >
        <DatePicker
          showTime
          format="DD/MM/YYYY HH:mm"
          placeholder="Selecione a data e hora de partida"
          style={{ width: "100%" }}
        />
      </Form.Item>

      <Form.Item
        name="returnAt"
        label="Data e Hora de Retorno"
        rules={[
          {
            required: true,
            message: "Por favor, selecione a data e hora de retorno",
          },
        ]}
      >
        <DatePicker
          showTime
          format="DD/MM/YYYY HH:mm"
          placeholder="Selecione a data e hora de retorno"
          style={{ width: "100%" }}
        />
      </Form.Item>

      <Form.Item
        name="formOpenAt"
        label="Data e Hora de Abertura do Formulário"
        rules={[
          {
            required: true,
            message: "Por favor, selecione a data e hora de abertura",
          },
        ]}
      >
        <DatePicker
          showTime
          format="DD/MM/YYYY HH:mm"
          placeholder="Selecione quando o formulário será aberto"
          style={{ width: "100%" }}
        />
      </Form.Item>

      <Form.Item
        name="formCloseAt"
        label="Data e Hora de Fechamento do Formulário"
        rules={[
          {
            required: true,
            message: "Por favor, selecione a data e hora de fechamento",
          },
        ]}
      >
        <DatePicker
          showTime
          format="DD/MM/YYYY HH:mm"
          placeholder="Selecione quando o formulário será fechado"
          style={{ width: "100%" }}
        />
      </Form.Item>

      <Form.Item name="isActive" label="Caravana Ativa" valuePropName="checked">
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


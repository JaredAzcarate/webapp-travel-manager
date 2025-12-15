"use client";

import {
  useCreateChapel,
  useUpdateChapel,
} from "@/features/chapels/hooks/chapels.hooks";
import {
  ChapelWithId,
  CreateChapelInput,
  UpdateChapelInput,
} from "@/features/chapels/models/chapels.model";
import { App, Button, Form, Input } from "antd";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface FormValues {
  name: string;
  whatsappPhone?: string;
  email?: string;
  address?: string;
}

interface ChapelFormProps {
  mode: "create" | "edit";
  chapelId?: string;
  initialChapelData?: ChapelWithId;
  onSuccess?: () => void;
}

export const ChapelForm = ({
  mode,
  chapelId,
  initialChapelData,
  onSuccess,
}: ChapelFormProps) => {
  const { notification } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<FormValues>();

  const {
    createChapel,
    isPending: isCreating,
    isSuccess: created,
    error: createError,
  } = useCreateChapel();

  const {
    updateChapel,
    isPending: isUpdating,
    isSuccess: updated,
    error: updateError,
  } = useUpdateChapel();

  useEffect(() => {
    if (mode === "edit" && initialChapelData) {
      form.setFieldsValue({
        name: initialChapelData.name,
        whatsappPhone: initialChapelData.whatsappPhone,
        email: initialChapelData.email,
        address: initialChapelData.address,
      });
    }
  }, [mode, initialChapelData, form]);

  useEffect(() => {
    if (mode === "create" && created) {
      notification.success({
        title: "Sucesso",
        description: "A capela foi criada com sucesso",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/chapels");
      }
      form.resetFields();
    }
  }, [mode, created, form, notification, onSuccess, router]);

  useEffect(() => {
    if (mode === "edit" && updated) {
      notification.success({
        title: "Sucesso",
        description: "A capela foi atualizada com sucesso",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/chapels");
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
        description: `Não foi possível criar a capela: ${errorMessage}`,
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
        description: `Não foi possível atualizar a capela: ${errorMessage}`,
      });
    }
  }, [mode, updateError, notification]);

  const handleSubmit = (values: FormValues) => {
    if (mode === "create") {
      const input: CreateChapelInput = {
        name: values.name,
        whatsappPhone: values.whatsappPhone,
        email: values.email,
        address: values.address,
      };
      createChapel(input);
    } else if (mode === "edit" && chapelId) {
      const input: UpdateChapelInput = {
        name: values.name,
        whatsappPhone: values.whatsappPhone,
        email: values.email,
        address: values.address,
      };
      updateChapel(chapelId, input);
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
        name="name"
        label="Nome da Capela"
        rules={[
          { required: true, message: "Por favor, insira o nome da capela" },
        ]}
      >
        <Input placeholder="Ex: Capela de Lisboa" />
      </Form.Item>

      <Form.Item name="whatsappPhone" label="WhatsApp">
        <Input placeholder="Ex: +351 912 345 678" />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email"
        rules={[
          { type: "email", message: "Por favor, insira um email válido" },
        ]}
      >
        <Input placeholder="Ex: capela@example.com" />
      </Form.Item>

      <Form.Item name="address" label="Endereço">
        <Input placeholder="Ex: Rua Exemplo, 123, Lisboa" />
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


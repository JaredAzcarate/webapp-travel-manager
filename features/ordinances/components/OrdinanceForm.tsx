"use client";

import {
  useCreateOrdinance,
  useUpdateOrdinance,
} from "@/features/ordinances/hooks/ordinances.hooks";
import {
  CreateOrdinanceInput,
  OrdinanceWithId,
  UpdateOrdinanceInput,
} from "@/features/ordinances/models/ordinances.model";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { App, Button, Form, Input, InputNumber, Select, Space } from "antd";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface SessionFormValue {
  slot: string;
  maxCapacity: number;
  gender?: "M" | "F" | "";
}

interface FormValues {
  name: string;
  sessions: SessionFormValue[];
}

interface OrdinanceFormProps {
  mode: "create" | "edit";
  ordinanceId?: string;
  initialOrdinanceData?: OrdinanceWithId;
  onSuccess?: () => void;
}

export const OrdinanceForm = ({
  mode,
  ordinanceId,
  initialOrdinanceData,
  onSuccess,
}: OrdinanceFormProps) => {
  const { notification } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<FormValues>();

  const {
    createOrdinance,
    isPending: isCreating,
    isSuccess: created,
    error: createError,
  } = useCreateOrdinance();

  const {
    updateOrdinance,
    isPending: isUpdating,
    isSuccess: updated,
    error: updateError,
  } = useUpdateOrdinance();

  useEffect(() => {
    if (mode === "edit" && initialOrdinanceData) {
      form.setFieldsValue({
        name: initialOrdinanceData.name,
        sessions:
          initialOrdinanceData.sessions?.map((session) => ({
            slot: session.slot,
            maxCapacity: session.maxCapacity,
            gender: session.gender === null ? "" : session.gender || "",
          })) || [],
      });
    }
  }, [mode, initialOrdinanceData, form]);

  useEffect(() => {
    if (mode === "create" && created) {
      notification.success({
        title: "Sucesso",
        description: "A ordenança foi criada com sucesso",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/ordinances");
      }
      form.resetFields();
    }
  }, [mode, created, form, notification, onSuccess, router]);

  useEffect(() => {
    if (mode === "edit" && updated) {
      notification.success({
        title: "Sucesso",
        description: "A ordenança foi atualizada com sucesso",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/ordinances");
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
        description: `Não foi possível criar a ordenança: ${errorMessage}`,
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
        description: `Não foi possível atualizar a ordenança: ${errorMessage}`,
      });
    }
  }, [mode, updateError, notification]);

  const handleSubmit = (values: FormValues) => {
    const sessions = values.sessions.map((session, index) => ({
      id: `session-${index}`,
      slot: session.slot,
      maxCapacity: session.maxCapacity,
      gender: session.gender === "" ? null : session.gender || null,
    }));

    if (mode === "create") {
      const input: CreateOrdinanceInput = {
        name: values.name,
        sessions,
      };
      createOrdinance(input);
    } else if (mode === "edit" && ordinanceId && initialOrdinanceData) {
      const input: UpdateOrdinanceInput = {
        name: values.name,
        sessions,
      };
      updateOrdinance(ordinanceId, input);
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
        sessions: [],
      }}
      className="flex flex-col gap-4"
    >
      <Form.Item
        name="name"
        label="Nome"
        rules={[{ required: true, message: "Por favor, insira o nome" }]}
      >
        <Input placeholder="Ex: Batistério" />
      </Form.Item>

      <Form.List
        name="sessions"
        rules={[
          {
            validator: async (_, sessions) => {
              if (!sessions || sessions.length === 0) {
                return Promise.reject(
                  new Error("Pelo menos uma sesión é necessária")
                );
              }

              const slots = sessions.map((s: SessionFormValue) => s.slot);
              const uniqueSlots = new Set(slots);
              if (slots.length !== uniqueSlots.size) {
                return Promise.reject(
                  new Error("Os horários das sesiones devem ser únicos")
                );
              }
            },
          },
        ]}
      >
        {(fields, { add, remove }) => (
          <>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Sessões</span>
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                size="small"
              >
                Adicionar sessão
              </Button>
            </div>

            {fields.map(({ key, name, ...restField }) => (
              <Space
                key={key}
                style={{ display: "flex", marginBottom: 8 }}
                align="baseline"
                className="w-full"
              >
                <Form.Item
                  {...restField}
                  name={[name, "slot"]}
                  rules={[
                    {
                      required: true,
                      message: "Horário é obrigatório",
                    },
                    {
                      pattern: /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/,
                      message: "Formato inválido. Use: HH:mm-HH:mm",
                    },
                  ]}
                  className="flex-1"
                >
                  <Input placeholder="Ex: 9:30-10:00" />
                </Form.Item>

                <Form.Item
                  {...restField}
                  name={[name, "maxCapacity"]}
                  rules={[
                    {
                      required: true,
                      message: "Capacidade máxima é obrigatória",
                    },
                    {
                      type: "number",
                      min: 1,
                      message: "A capacidade deve ser pelo menos 1",
                    },
                  ]}
                  className="w-32"
                >
                  <InputNumber
                    placeholder="Capacidade"
                    min={1}
                    style={{ width: "100%" }}
                  />
                </Form.Item>

                <Form.Item
                  {...restField}
                  name={[name, "gender"]}
                  className="w-32"
                >
                  <Select
                    placeholder="Género"
                    allowClear
                    options={[
                      { label: "Ambos", value: "" },
                      { label: "Masculino", value: "M" },
                      { label: "Feminino", value: "F" },
                    ]}
                  />
                </Form.Item>

                <MinusCircleOutlined
                  onClick={() => remove(name)}
                  className="text-red-500"
                />
              </Space>
            ))}
          </>
        )}
      </Form.List>

      <Form.Item>
        <div className="flex gap-2">
          <Button onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            type="primary"
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

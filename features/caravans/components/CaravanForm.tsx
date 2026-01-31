"use client";

import { toDate } from "@/common/utils/timestamp.utils";
import { useBuses } from "@/features/buses/hooks/buses.hooks";
import {
  useCreateCaravan,
  useUpdateCaravan,
} from "@/features/caravans/hooks/caravans.hooks";
import {
  CaravanWithId,
  CreateCaravanInput,
  UpdateCaravanInput,
} from "@/features/caravans/models/caravans.model";
import { App, Button, DatePicker, Form, Input, Select } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Check, X } from "phosphor-react";
import { useEffect } from "react";

interface FormValues {
  name: string;
  departureAt: Dayjs;
  returnAt: Dayjs;
  formOpenAt: Dayjs;
  formCloseAt: Dayjs;
  busIds?: { busId: string }[];
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
  const { buses, loading: loadingBuses } = useBuses();

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
        departureAt: toDate(initialCaravanData.departureAt)
          ? dayjs(toDate(initialCaravanData.departureAt))
          : undefined,
        returnAt: toDate(initialCaravanData.returnAt)
          ? dayjs(toDate(initialCaravanData.returnAt))
          : undefined,
        formOpenAt: toDate(initialCaravanData.formOpenAt)
          ? dayjs(toDate(initialCaravanData.formOpenAt))
          : undefined,
        formCloseAt: toDate(initialCaravanData.formCloseAt)
          ? dayjs(toDate(initialCaravanData.formCloseAt))
          : undefined,
        busIds: initialCaravanData.busIds?.map((busId) => ({ busId })) ?? [],
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

    const busIdsArray = values.busIds?.map((item) => item.busId) ?? [];
    const formOpenAt = convertToTimestamp(values.formOpenAt);
    const formCloseAt = convertToTimestamp(values.formCloseAt);
    const now = Timestamp.now();

    // Calculate isActive based on current time being between formOpenAt and formCloseAt
    const isActive =
      now.toMillis() >= formOpenAt.toMillis() &&
      now.toMillis() <= formCloseAt.toMillis();

    if (mode === "create") {
      const input: CreateCaravanInput = {
        name: values.name,
        departureAt: convertToTimestamp(values.departureAt),
        returnAt: convertToTimestamp(values.returnAt),
        formOpenAt,
        formCloseAt,
        isActive,
        busIds: busIdsArray,
      };
      createCaravan(input);
    } else if (mode === "edit" && caravanId) {
      const input: UpdateCaravanInput = {
        name: values.name,
        departureAt: convertToTimestamp(values.departureAt),
        returnAt: convertToTimestamp(values.returnAt),
        formOpenAt,
        formCloseAt,
        isActive,
        busIds: busIdsArray,
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
        busIds: [],
      }}
      onValuesChange={(changedValues, allValues) => {
        if (changedValues.busIds) {
          const currentBusIds = allValues.busIds || [];
          const selectedBusIds = currentBusIds
            .map((item: { busId?: string }) => item?.busId)
            .filter((id): id is string => Boolean(id));
          const duplicates = selectedBusIds.filter(
            (id: string, index: number) => selectedBusIds.indexOf(id) !== index
          );
          if (duplicates.length > 0) {
            form.setFields([
              {
                name: ["busIds"],
                errors: ["Não pode haver buses duplicados"],
              },
            ]);
          } else {
            form.setFields([
              {
                name: ["busIds"],
                errors: undefined,
              },
            ]);
          }
        }
      }}
      className="flex flex-col gap-4"
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

      <Form.Item
        label="Autocarros"
        required
        tooltip="Adicione pelo menos um autocarro à caravana"
      >
        <Form.List name="busIds">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => {
                const currentBusIds = form.getFieldValue("busIds") || [];
                const currentBusId = currentBusIds[name]?.busId;
                const selectedBusIds = currentBusIds
                  .map((item: { busId?: string }, idx: number) =>
                    idx !== name ? item?.busId : undefined
                  )
                  .filter(Boolean);
                const availableBuses = buses.filter(
                  (bus) => !selectedBusIds.includes(bus.id)
                );
                const allBusesForSelect = currentBusId
                  ? [
                    ...buses
                      .filter((bus) => bus.id === currentBusId)
                      .map((bus) => ({
                        label: `${bus.name} (Capacidade: ${bus.capacity})`,
                        value: bus.id,
                      })),
                    ...availableBuses.map((bus) => ({
                      label: `${bus.name} (Capacidade: ${bus.capacity})`,
                      value: bus.id,
                    })),
                  ]
                  : availableBuses.map((bus) => ({
                    label: `${bus.name} (Capacidade: ${bus.capacity})`,
                    value: bus.id,
                  }));

                return (
                  <div
                    key={key}
                    className="mb-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <Form.Item
                          {...restField}
                          name={[name, "busId"]}
                          label="Autocarro"
                          rules={[
                            {
                              required: true,
                              message: "Por favor, selecione um autocarro",
                            },
                          ]}
                        >
                          <Select
                            placeholder="Selecione um autocarro"
                            loading={loadingBuses}
                            options={allBusesForSelect}
                          />
                        </Form.Item>
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="text"
                          danger
                          onClick={() => remove(name)}
                          disabled={isPending}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  disabled={isPending}
                >
                  + Adicionar Autocarro
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form.Item>

      <Form.Item>
        <div className="flex gap-2">
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

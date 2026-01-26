"use client";

import { useCreateBus, useUpdateBus } from "@/features/buses/hooks/buses.hooks";
import { useBusStopsByBusId, useCreateBusStop, useDeleteBusStop } from "@/features/buses/hooks/busStops.hooks";
import {
  BusWithId,
  CreateBusInput,
  UpdateBusInput,
} from "@/features/buses/models/buses.model";
import {
  BusStopWithId,
  CreateBusStopInput,
} from "@/features/buses/models/busStops.model";
import { useChapels } from "@/features/chapels/hooks/chapels.hooks";
import { useQueryClient } from "@tanstack/react-query";
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  TimePicker,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Trash } from "phosphor-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface BusStopFormValue {
  chapelId: string;
  pickupTime: Dayjs;
}

interface FormValues {
  name: string;
  capacity: number;
  busStops: BusStopFormValue[];
}

interface BusFormProps {
  mode: "create" | "edit";
  busId?: string;
  initialBusData?: BusWithId;
  initialBusStops?: BusStopWithId[];
  onSuccess?: () => void;
}

export const BusForm = ({
  mode,
  busId,
  initialBusData,
  initialBusStops,
  onSuccess,
}: BusFormProps) => {
  const { notification } = App.useApp();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormValues>();

  const {
    createBus,
    isPending: isCreatingBus,
    isSuccess: busCreated,
    error: busError,
    data: createdBus,
  } = useCreateBus();

  const {
    updateBus,
    isPending: isUpdatingBus,
    isSuccess: busUpdated,
    error: updateError,
  } = useUpdateBus();

  const { busStops: existingBusStops } = useBusStopsByBusId(
    mode === "edit" && busId ? busId : ""
  );

  const { createBusStop } = useCreateBusStop();
  const { deleteBusStop } = useDeleteBusStop();

  const { chapels, loading: loadingChapels } = useChapels();
  const [isProcessingStops, setIsProcessingStops] = useState(false);
  const hasProcessedStops = useRef(false);

  const busStops = Form.useWatch("busStops", form) || [];

  const sortedStops = useMemo(() => {
    if (!busStops.length) return [];

    return busStops
      .map((stop, index) => ({ ...stop, originalIndex: index }))
      .filter((stop) => stop.pickupTime && stop.chapelId)
      .sort((a, b) => {
        const timeA = a.pickupTime?.valueOf() || 0;
        const timeB = b.pickupTime?.valueOf() || 0;
        return timeA - timeB;
      })
      .map((stop, sortedIndex) => ({
        ...stop,
        order: sortedIndex + 1,
      }));
  }, [busStops]);

  const stopsToUse =
    mode === "edit" && initialBusStops ? initialBusStops : existingBusStops;

  useEffect(() => {
    if (mode === "edit" && initialBusData && stopsToUse.length > 0) {
      form.setFieldsValue({
        name: initialBusData.name,
        capacity: initialBusData.capacity,
        busStops: stopsToUse.map((stop) => ({
          chapelId: stop.chapelId,
          pickupTime: stop.pickupTime
            ? dayjs(stop.pickupTime.toDate())
            : undefined,
        })),
      });
    }
  }, [mode, initialBusData, stopsToUse, form]);

  useEffect(() => {
    if (
      mode === "create" &&
      busCreated &&
      createdBus?.id &&
      sortedStops.length > 0 &&
      !isProcessingStops &&
      !hasProcessedStops.current
    ) {
      hasProcessedStops.current = true;
      createAllBusStops(createdBus.id);
    }
  }, [mode, busCreated, createdBus?.id, sortedStops.length, isProcessingStops]);

  useEffect(() => {
    if (
      mode === "create" &&
      busCreated &&
      createdBus?.id &&
      sortedStops.length === 0 &&
      !hasProcessedStops.current
    ) {
      notification.success({
        title: "Sucesso",
        description: "O autocarro foi criado com sucesso",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/buses");
      }
      form.resetFields();
      hasProcessedStops.current = false;
    }
  }, [
    mode,
    busCreated,
    createdBus?.id,
    sortedStops.length,
    form,
    notification,
    onSuccess,
    router,
  ]);

  useEffect(() => {
    if (mode === "create" && busError) {
      const errorMessage =
        busError instanceof Error ? busError.message : "Erro desconhecido";
      notification.error({
        title: "Erro",
        description: `Não foi possível criar o autocarro: ${errorMessage}`,
      });
    }
  }, [mode, busError, notification]);

  useEffect(() => {
    if (
      mode === "edit" &&
      busUpdated &&
      !isProcessingStops &&
      !hasProcessedStops.current
    ) {
      if (sortedStops.length > 0) {
        hasProcessedStops.current = true;
        updateAllBusStops(busId!);
      } else {
        notification.success({
          title: "Sucesso",
          description: "O autocarro foi atualizado com sucesso",
        });
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/admin/buses");
        }
        hasProcessedStops.current = false;
      }
    }
  }, [mode, busUpdated, busId, sortedStops.length, isProcessingStops]);

  useEffect(() => {
    if (mode === "edit" && updateError) {
      const errorMessage =
        updateError instanceof Error
          ? updateError.message
          : "Erro desconhecido";
      notification.error({
        title: "Erro",
        description: `Não foi possível atualizar o autocarro: ${errorMessage}`,
      });
    }
  }, [mode, updateError, notification]);

  const createAllBusStops = async (newBusId: string) => {
    if (!newBusId || sortedStops.length === 0) return;

    setIsProcessingStops(true);

    try {
      const today = dayjs().startOf("day");

      for (const stop of sortedStops) {
        const pickupTime = Timestamp.fromDate(
          today
            .hour(stop.pickupTime.hour())
            .minute(stop.pickupTime.minute())
            .toDate()
        );

        const busStopInput: CreateBusStopInput = {
          busId: newBusId,
          chapelId: stop.chapelId,
          order: stop.order,
          pickupTime,
        };

        await createBusStop(busStopInput);
      }

      queryClient.invalidateQueries({ queryKey: ["busStops"] });
      queryClient.invalidateQueries({
        queryKey: ["busStops", "byBus", newBusId],
      });

      notification.success({
        title: "Sucesso",
        description: "O autocarro e as paradas foram criados com sucesso",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/buses");
      }
      form.resetFields();
      hasProcessedStops.current = false;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      notification.error({
        title: "Erro",
        description: `Não foi possível criar as paradas: ${errorMessage}`,
      });
      hasProcessedStops.current = false;
    } finally {
      setIsProcessingStops(false);
    }
  };

  const updateAllBusStops = async (editBusId: string) => {
    if (!editBusId) return;

    setIsProcessingStops(true);

    try {
      const existingStops = stopsToUse;

      for (const stop of existingStops) {
        await deleteBusStop(stop.id);
      }

      const today = dayjs().startOf("day");

      for (const stop of sortedStops) {
        const pickupTime = Timestamp.fromDate(
          today
            .hour(stop.pickupTime.hour())
            .minute(stop.pickupTime.minute())
            .toDate()
        );

        const busStopInput: CreateBusStopInput = {
          busId: editBusId,
          chapelId: stop.chapelId,
          order: stop.order,
          pickupTime,
        };

        await createBusStop(busStopInput);
      }

      queryClient.invalidateQueries({ queryKey: ["busStops"] });
      queryClient.invalidateQueries({
        queryKey: ["busStops", "byBus", editBusId],
      });

      notification.success({
        title: "Sucesso",
        description: "O autocarro e as paradas foram atualizados com sucesso",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/buses");
      }
      hasProcessedStops.current = false;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      notification.error({
        title: "Erro",
        description: `Não foi possível atualizar as paradas: ${errorMessage}`,
      });
      hasProcessedStops.current = false;
    } finally {
      setIsProcessingStops(false);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    if (!values.busStops || values.busStops.length === 0) {
      notification.error({
        title: "Erro",
        description: "Por favor, adicione pelo menos uma parada",
      });
      return;
    }

    const validStops = values.busStops.filter(
      (stop) => stop.chapelId && stop.pickupTime
    );

    if (validStops.length === 0) {
      notification.error({
        title: "Erro",
        description:
          "Por favor, complete pelo menos uma parada com capela e hora",
      });
      return;
    }

    hasProcessedStops.current = false;

    if (mode === "create") {
      const input: CreateBusInput = {
        name: values.name,
        capacity: values.capacity,
      };
      createBus(input);
    } else if (mode === "edit" && busId) {
      const input: UpdateBusInput = {
        name: values.name,
        capacity: values.capacity,
      };
      updateBus(busId, input);
    }
  };

  const isPending =
    (mode === "create" && (isCreatingBus || isProcessingStops)) ||
    (mode === "edit" && (isUpdatingBus || isProcessingStops));

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      style={{ width: "100%" }}
      initialValues={{
        busStops: [],
      }}
      className="flex flex-col gap-4"
    >
      <Form.Item
        name="name"
        label="Nome do Autocarro"
        rules={[
          { required: true, message: "Por favor, insira o nome do autocarro" },
        ]}
      >
        <Input placeholder="Ex: Autocarro 1" />
      </Form.Item>

      <Form.Item
        name="capacity"
        label="Capacidade"
        rules={[
          { required: true, message: "Por favor, insira a capacidade" },
          {
            type: "number",
            min: 1,
            message: "A capacidade deve ser maior que zero",
          },
        ]}
      >
        <InputNumber placeholder="Ex: 50" min={1} style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item
        label="Paragens do autocarro"
        required
        tooltip="Adicione pelo menos uma paragem com uma unidade e hora de saída"
      >
        <Form.List name="busStops">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => {
                const stop = busStops[name];
                const sortedStop = sortedStops.find(
                  (s) => s.originalIndex === name
                );
                const order = sortedStop?.order;

                return (
                  <div
                    key={key}
                    className="mb-4 p-4 border bg-white border-white rounded-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <Form.Item
                          {...restField}
                          name={[name, "chapelId"]}
                          label="Unidade"
                          rules={[
                            {
                              required: true,
                              message: "Por favor, selecione uma unidade",
                            },
                          ]}
                        >
                          <Select
                            placeholder="Selecione uma unidade"
                            loading={loadingChapels}
                            options={chapels.map((chapel) => ({
                              label: chapel.name,
                              value: chapel.id,
                            }))}
                          />
                        </Form.Item>
                      </div>

                      <div className="flex-1">
                        <Form.Item
                          {...restField}
                          name={[name, "pickupTime"]}
                          label="Hora de saída"
                          rules={[
                            {
                              required: true,
                              message: "Por favor, selecione a hora",
                            },
                          ]}
                        >
                          <TimePicker
                            format="HH:mm"
                            placeholder="Selecione a hora"
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="text"
                          danger
                          icon={<Trash size={16} />}
                          onClick={() => remove(name)}
                          disabled={isPending}
                        >

                        </Button>
                      </div>
                    </div>

                    {order && (
                      <div className="text-sm text-gray-500 mt-2">
                        Ordem: {order} (calculada automaticamente pela hora)
                      </div>
                    )}
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
                  + Adicionar paragem
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form.Item>

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

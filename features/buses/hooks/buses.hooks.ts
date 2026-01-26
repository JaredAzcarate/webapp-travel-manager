import {
  CreateBusInput,
  UpdateBusInput,
} from "@/features/buses/models/buses.model";
import { BusRepository } from "@/features/buses/repositories/buses.repository";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const repository = new BusRepository();

export const useBuses = () => {
  const {
    data: buses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["buses"],
    queryFn: () => repository.getAll(),
  });

  return {
    buses,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

export const useBus = (id: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["buses", id],
    queryFn: () => repository.getById(id),
    enabled: !!id,
  });

  return {
    bus: data,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

export const useCreateBus = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (input: CreateBusInput) => {
      const response = await fetch("/api/buses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao criar autocarro");
      }

      const result = await response.json();
      return result.bus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
    },
  });

  const createBus = (input: CreateBusInput) => {
    mutation.mutate(input);
  };

  return {
    createBus,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
    data: mutation.data,
  };
};

export const useUpdateBus = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateBusInput }) => {
      const response = await fetch(`/api/buses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao atualizar autocarro");
      }

      const result = await response.json();
      return result.bus;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      queryClient.invalidateQueries({ queryKey: ["buses", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["busStops"] });
    },
  });

  const updateBus = (id: string, input: UpdateBusInput) => {
    mutation.mutate({ id, input });
  };

  return {
    updateBus,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

export const useDeleteBus = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/buses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao eliminar autocarro");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      queryClient.invalidateQueries({ queryKey: ["busStops"] });
    },
  });

  const deleteBus = (id: string) => {
    mutation.mutate(id);
  };

  return {
    deleteBus,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

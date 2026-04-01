import {
  CaravanWithId,
  CreateCaravanInput,
  UpdateCaravanInput,
} from "@/features/caravans/models/caravans.model";
import { CaravanRepository } from "@/features/caravans/repositories/caravans.repository";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const repository = new CaravanRepository();

export const useCaravans = () => {
  const {
    data: caravans = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["caravans"],
    queryFn: () => repository.getAll(),
  });

  return {
    caravans,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

export const useCaravan = (id: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["caravans", id],
    queryFn: () => repository.getById(id),
    enabled: !!id,
  });

  return {
    caravan: data,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

export const useCreateCaravan = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (input: CreateCaravanInput) => {
      const response = await fetch("/api/caravans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao criar viagem");
      }

      const result = await response.json();
      return result.caravan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caravans"] });
    },
  });

  const createCaravan = (input: CreateCaravanInput) => {
    mutation.mutate(input);
  };

  return {
    createCaravan,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

export const useUpdateCaravan = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateCaravanInput }) => {
      const response = await fetch(`/api/caravans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao atualizar viagem");
      }

      const result = await response.json();
      return result.caravan;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["caravans"] });
      queryClient.invalidateQueries({ queryKey: ["caravans", variables.id] });
    },
  });

  const updateCaravan = (id: string, input: UpdateCaravanInput) => {
    mutation.mutate({ id, input });
  };

  return {
    updateCaravan,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

export const useDeleteCaravan = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/caravans/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao eliminar viagem");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caravans"] });
    },
  });

  const deleteCaravan = (id: string) => {
    mutation.mutate(id);
  };

  return {
    deleteCaravan,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

export const useUpdateCaravanOrdinanceCapacities = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      caravanId,
      ordinanceCapacityLimits,
    }: {
      caravanId: string;
      ordinanceCapacityLimits: NonNullable<
        CaravanWithId["ordinanceCapacityLimits"]
      >;
    }) => {
      const response = await fetch(
        `/api/caravans/${caravanId}/ordinance-capacities`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ordinanceCapacityLimits }),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Erro ao atualizar cupos");
      }
      const result = await response.json();
      return result.caravan as CaravanWithId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["caravans"] });
      queryClient.invalidateQueries({ queryKey: ["caravans", variables.caravanId] });
    },
  });
};

export const useActiveCaravans = () => {
  const {
    data: caravans = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["caravans", "active"],
    queryFn: () => repository.getActive(),
  });

  return {
    caravans,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

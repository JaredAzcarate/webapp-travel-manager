import {
  CreateChapelInput,
  UpdateChapelInput,
} from "@/features/chapels/models/chapels.model";
import { ChapelRepository } from "@/features/chapels/repositories/chapels.repository";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const repository = new ChapelRepository();

export const useChapels = () => {
  const {
    data: chapels = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["chapels"],
    queryFn: () => repository.getAll(),
  });

  return {
    chapels,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

export const useChapel = (id: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["chapels", id],
    queryFn: () => repository.getById(id),
    enabled: !!id,
  });

  return {
    chapel: data,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

export const useCreateChapel = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (input: CreateChapelInput) => {
      const response = await fetch("/api/chapels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao criar capela");
      }

      const result = await response.json();
      return result.chapel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapels"] });
    },
  });

  const createChapel = (input: CreateChapelInput) => {
    mutation.mutate(input);
  };

  return {
    createChapel,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

export const useUpdateChapel = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateChapelInput }) => {
      const response = await fetch(`/api/chapels/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao atualizar capela");
      }

      const result = await response.json();
      return result.chapel;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chapels"] });
      queryClient.invalidateQueries({ queryKey: ["chapels", variables.id] });
    },
  });

  const updateChapel = (id: string, input: UpdateChapelInput) => {
    mutation.mutate({ id, input });
  };

  return {
    updateChapel,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

export const useDeleteChapel = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/chapels/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao eliminar capela");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapels"] });
    },
  });

  const deleteChapel = (id: string) => {
    mutation.mutate(id);
  };

  return {
    deleteChapel,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

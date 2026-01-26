import { RegistrationRepository } from "@/features/registrations/repositories/registrations.repository";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreateOrdinanceInput,
  UpdateOrdinanceInput,
} from "../models/ordinances.model";
import { ordinanceRepository } from "../repositories/ordinances.repository";

const registrationRepository = new RegistrationRepository();

export const useOrdinances = () => {
  const {
    data: ordinances = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ordinances"],
    queryFn: () => ordinanceRepository.getAll(),
  });

  return {
    ordinances,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

export const useOrdinance = (id: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["ordinances", id],
    queryFn: () => ordinanceRepository.getById(id),
    enabled: !!id,
  });

  return {
    ordinance: data || null,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

export const useCreateOrdinance = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (input: CreateOrdinanceInput) => {
      const response = await fetch("/api/ordinances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao criar ordenança");
      }

      const result = await response.json();
      return result.ordinance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordinances"] });
    },
  });

  const createOrdinance = (input: CreateOrdinanceInput) => {
    mutation.mutate(input);
  };

  return {
    createOrdinance,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

export const useUpdateOrdinance = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateOrdinanceInput }) => {
      const response = await fetch(`/api/ordinances/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao atualizar ordenança");
      }

      const result = await response.json();
      return result.ordinance;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ordinances"] });
      queryClient.invalidateQueries({ queryKey: ["ordinances", variables.id] });
    },
  });

  const updateOrdinance = (id: string, input: UpdateOrdinanceInput) => {
    mutation.mutate({ id, input });
  };

  return {
    updateOrdinance,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

export const useDeleteOrdinance = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/ordinances/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao eliminar ordenança");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordinances"] });
    },
  });

  const deleteOrdinance = (id: string) => {
    mutation.mutate(id);
  };

  return {
    deleteOrdinance,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};


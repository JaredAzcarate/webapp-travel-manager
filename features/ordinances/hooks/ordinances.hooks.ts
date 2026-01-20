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
    mutationFn: (input: CreateOrdinanceInput) =>
      ordinanceRepository.create(input),
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
    mutationFn: ({ id, input }: { id: string; input: UpdateOrdinanceInput }) =>
      ordinanceRepository.update(id, input),
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
    mutationFn: (id: string) => ordinanceRepository.delete(id),
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


import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChapelRepository } from "../repositories/chapels.repository";
import { CreateChapelInput, UpdateChapelInput } from "../models/chapels.model";

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
    mutationFn: (input: CreateChapelInput) => repository.create(input),
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
    mutationFn: ({ id, input }: { id: string; input: UpdateChapelInput }) =>
      repository.update(id, input),
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
    mutationFn: (id: string) => repository.delete(id),
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

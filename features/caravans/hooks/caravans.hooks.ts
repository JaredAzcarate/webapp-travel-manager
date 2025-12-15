import {
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
    mutationFn: (input: CreateCaravanInput) => repository.create(input),
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
    mutationFn: ({ id, input }: { id: string; input: UpdateCaravanInput }) =>
      repository.update(id, input),
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
    mutationFn: (id: string) => repository.delete(id),
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

import {
  CreateRegistrationInput,
  UpdateRegistrationInput,
} from "@/features/registrations/models/registrations.model";
import { RegistrationRepository } from "@/features/registrations/repositories/registrations.repository";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const repository = new RegistrationRepository();

export const useRegistrations = () => {
  const {
    data: registrations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["registrations"],
    queryFn: () => repository.getAll(),
  });

  return {
    registrations,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

export const useRegistration = (id: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["registrations", id],
    queryFn: () => repository.getById(id),
    enabled: !!id,
  });

  return {
    registration: data,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

export const useRegistrationsByPhone = (phone: string, caravanId?: string) => {
  const {
    data: registrations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["registrations", "byPhone", phone, caravanId],
    queryFn: () => repository.getByPhone(phone, caravanId),
    enabled: !!phone,
  });

  return {
    registrations,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

export const useRegistrationsByCaravanId = (caravanId: string) => {
  const {
    data: registrations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["registrations", "byCaravan", caravanId],
    queryFn: () => repository.getByCaravanId(caravanId),
    enabled: !!caravanId,
  });

  return {
    registrations,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

export const useRegistrationsByChapelId = (
  chapelId: string,
  caravanId?: string
) => {
  const {
    data: registrations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["registrations", "byChapel", chapelId, caravanId],
    queryFn: () => repository.getByChapelId(chapelId, caravanId),
    enabled: !!chapelId,
  });

  return {
    registrations,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

export const useRegistrationsByBusId = (busId: string, caravanId: string) => {
  const {
    data: registrations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["registrations", "byBus", busId, caravanId],
    queryFn: () => repository.getByBusId(busId, caravanId),
    enabled: !!busId && !!caravanId,
  });

  return {
    registrations,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

export const useCountActiveByBus = (caravanId: string, busId: string) => {
  const {
    data: count = 0,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["registrations", "count", caravanId, busId],
    queryFn: () => repository.countActiveByBus(caravanId, busId),
    enabled: !!caravanId && !!busId,
  });

  return {
    count,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

export const useCreateRegistration = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: CreateRegistrationInput) => repository.create(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({
        queryKey: ["registrations", "byCaravan", data.caravanId],
      });
      queryClient.invalidateQueries({
        queryKey: ["registrations", "byChapel", data.chapelId],
      });
      queryClient.invalidateQueries({
        queryKey: ["registrations", "byBus", data.busId, data.caravanId],
      });
      queryClient.invalidateQueries({
        queryKey: ["registrations", "count", data.caravanId, data.busId],
      });
    },
  });

  const createRegistration = (input: CreateRegistrationInput) => {
    mutation.mutate(input);
  };

  return {
    createRegistration,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

export const useUpdateRegistration = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateRegistrationInput;
    }) => repository.update(id, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({
        queryKey: ["registrations", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["registrations", "byCaravan", data.caravanId],
      });
      queryClient.invalidateQueries({
        queryKey: ["registrations", "byChapel", data.chapelId],
      });
      queryClient.invalidateQueries({
        queryKey: ["registrations", "byBus", data.busId, data.caravanId],
      });
      queryClient.invalidateQueries({
        queryKey: ["registrations", "count", data.caravanId, data.busId],
      });
    },
  });

  const updateRegistration = (id: string, input: UpdateRegistrationInput) => {
    mutation.mutate({ id, input });
  };

  return {
    updateRegistration,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

export const useDeleteRegistration = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => repository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
    },
  });

  const deleteRegistration = (id: string) => {
    mutation.mutate(id);
  };

  return {
    deleteRegistration,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

export const useFilteredRegistrations = (
  caravanId: string,
  filters?: {
    chapelId?: string;
    paymentStatus?: string;
  }
) => {
  const {
    data: registrations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["registrations", "filtered", caravanId, filters],
    queryFn: () => repository.getFiltered(caravanId, filters),
    enabled: !!caravanId,
  });

  return {
    registrations,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

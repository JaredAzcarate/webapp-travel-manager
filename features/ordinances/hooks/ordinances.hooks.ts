import { OrdinanceType } from "@/features/registrations/models/registrations.model";
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

export const useOrdinanceByType = (type: OrdinanceType | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["ordinances", "byType", type],
    queryFn: () => {
      if (!type) return null;
      return ordinanceRepository.getByType(type);
    },
    enabled: !!type,
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
      queryClient.invalidateQueries({
        queryKey: ["ordinances", "byType"],
      });
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

export const useOrdinanceAvailability = (
  caravanId: string | null,
  type: OrdinanceType | null,
  slot: string | null
) => {
  const { ordinance, loading: loadingOrdinance } = useOrdinanceByType(type);

  const { data, isLoading } = useQuery({
    queryKey: ["ordinanceAvailability", caravanId, type, slot],
    queryFn: async () => {
      if (!caravanId || !type || !slot || !ordinance) {
        return { available: 0, occupied: 0, maxCapacity: 0 };
      }

      const session = ordinance.sessions.find((s) => s.slot === slot);
      if (!session) {
        return { available: 0, occupied: 0, maxCapacity: 0 };
      }

      // This method is deprecated - now using ordinanceCapacityCounts from caravan
      // Returning maxCapacity for now until we implement proper capacity checking
      return {
        available: session.maxCapacity,
        occupied: 0,
        maxCapacity: session.maxCapacity,
      };
    },
    enabled:
      !!caravanId && !!type && !!slot && !!ordinance && !loadingOrdinance,
  });

  return {
    available: data?.available ?? 0,
    occupied: data?.occupied ?? 0,
    maxCapacity: data?.maxCapacity ?? 0,
    loading: isLoading || loadingOrdinance,
  };
};

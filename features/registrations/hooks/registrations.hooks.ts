import { useCaravan } from "@/features/caravans/hooks/caravans.hooks";
import {
  getCountForGender,
  getLimitForGender,
  type CapacityValue,
} from "@/features/caravans/utils/ordinanceCapacity.utils";
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

export const useActiveRegistrationsByBusId = (
  busId: string,
  caravanId: string
) => {
  const {
    data: registrations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["registrations", "active", busId, caravanId],
    queryFn: () => repository.getActiveByBusId(busId, caravanId),
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

export const useCancelledRegistrationsByBusId = (
  busId: string,
  caravanId: string
) => {
  const {
    data: registrations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["registrations", "cancelled", busId, caravanId],
    queryFn: () => repository.getCancelledByBusId(busId, caravanId),
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
    queryKey: ["registrations", "count", "active", caravanId, busId],
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

export const useCountCancelledByBus = (caravanId: string, busId: string) => {
  const {
    data: count = 0,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["registrations", "count", "cancelled", caravanId, busId],
    queryFn: () => repository.countCancelledByBus(caravanId, busId),
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
      // Invalidate waitlist query
      queryClient.invalidateQueries({
        queryKey: ["waitlist", data.caravanId],
      });
      // Invalidate caravan query to refresh ordinanceCapacityCounts
      queryClient.invalidateQueries({
        queryKey: ["caravans", data.caravanId],
      });
      queryClient.invalidateQueries({
        queryKey: ["caravans"],
      });
      // Invalidate ordinance availability queries
      queryClient.invalidateQueries({
        queryKey: ["ordinance-availability"],
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
      // Invalidate caravan query to refresh ordinanceCapacityCounts
      queryClient.invalidateQueries({
        queryKey: ["caravans", data.caravanId],
      });
      queryClient.invalidateQueries({
        queryKey: ["caravans"],
      });
      // Invalidate ordinance availability queries
      queryClient.invalidateQueries({
        queryKey: ["ordinance-availability"],
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

export const useMarkPaymentAsPaid = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      return await repository.markPaymentAsPaid(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
    },
  });

  const markPaymentAsPaid = async (id: string) => {
    return mutation.mutateAsync(id);
  };

  return {
    markPaymentAsPaid,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

export const useCancelRegistration = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      return await repository.cancelRegistration(id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({
        queryKey: ["registrations", data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["registrations", "byCaravan", data.caravanId],
      });
      queryClient.invalidateQueries({
        queryKey: ["registrations", "byBus", data.busId, data.caravanId],
      });
      queryClient.invalidateQueries({
        queryKey: ["registrations", "count", "active", data.caravanId, data.busId],
      });
      queryClient.invalidateQueries({
        queryKey: ["waitlist", data.caravanId],
      });
      // Invalidate caravan query to refresh ordinanceCapacityCounts
      queryClient.invalidateQueries({
        queryKey: ["caravans", data.caravanId],
      });
      queryClient.invalidateQueries({
        queryKey: ["caravans"],
      });
      // Invalidate ordinance availability queries
      queryClient.invalidateQueries({
        queryKey: ["ordinance-availability"],
      });
    },
  });

  const cancelRegistration = async (id: string) => {
    return mutation.mutateAsync(id);
  };

  return {
    cancelRegistration,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

export const useOrdinanceAvailabilityFromCaravan = (
  caravanId: string | null,
  ordinanceId: string | null,
  slot: string | null,
  gender: "M" | "F" | null
) => {
  const { caravan, loading } = useCaravan(caravanId || "");

  const availability = useQuery({
    queryKey: ["ordinance-availability", caravanId, ordinanceId, slot, gender],
    queryFn: () => {
      if (!caravan || !ordinanceId || !slot) {
        return { available: 0, maxCapacity: 0 };
      }

      const limitValue: CapacityValue | undefined =
        caravan.ordinanceCapacityLimits?.[ordinanceId]?.[slot];
      const countValue: CapacityValue | undefined =
        caravan.ordinanceCapacityCounts?.[ordinanceId]?.[slot];

      if (limitValue === undefined || countValue === undefined) {
        return { available: 0, maxCapacity: 0 };
      }

      const limit: number = getLimitForGender(limitValue, gender);
      const count: number = getCountForGender(countValue, gender);

      return {
        available: Math.max(0, limit - count),
        maxCapacity: limit,
      };
    },
    enabled: !!caravanId && !!ordinanceId && !!slot && !!caravan,
  });

  return {
    available: availability.data?.available ?? 0,
    maxCapacity: availability.data?.maxCapacity ?? 0,
    loading: loading || availability.isLoading,
  };
};

export const useOrdinanceSlotsAvailabilityFromCaravan = (
  caravanId: string | null,
  ordinanceId: string | null,
  slots: string[],
  gender: "M" | "F" | null
) => {
  const { caravan, loading } = useCaravan(caravanId || "");

  const availabilityMap = useQuery({
    queryKey: ["ordinance-slots-availability", caravanId, ordinanceId, slots.join(","), gender],
    queryFn: () => {
      if (!caravan || !ordinanceId || slots.length === 0) {
        return {};
      }

      const map: Record<string, { available: number; maxCapacity: number }> = {};

      slots.forEach((slot) => {
        const limitValue: CapacityValue | undefined =
          caravan.ordinanceCapacityLimits?.[ordinanceId]?.[slot];
        const countValue: CapacityValue | undefined =
          caravan.ordinanceCapacityCounts?.[ordinanceId]?.[slot];

        if (limitValue !== undefined && countValue !== undefined) {
          const limit: number = getLimitForGender(limitValue, gender);
          const count: number = getCountForGender(countValue, gender);

          map[slot] = {
            available: Math.max(0, limit - count),
            maxCapacity: limit,
          };
        } else {
          map[slot] = {
            available: 0,
            maxCapacity: 0,
          };
        }
      });

      return map;
    },
    enabled: !!caravanId && !!ordinanceId && slots.length > 0 && !!caravan,
  });

  return {
    availabilityMap: availabilityMap.data ?? {},
    loading: loading || availabilityMap.isLoading,
  };
};

export const useWaitlistByCaravanId = (caravanId: string) => {
  const query = useQuery({
    queryKey: ["waitlist", caravanId],
    queryFn: () => repository.getWaitlistByCaravanId(caravanId),
    enabled: !!caravanId,
  });

  return {
    waitlist: query.data || [],
    loading: query.isLoading,
    error: query.error,
  };
};

export const usePromoteFromWaitlist = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => repository.promoteFromWaitlist(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({
        queryKey: ["registrations", "byCaravan", data.caravanId],
      });
      queryClient.invalidateQueries({
        queryKey: ["registrations", "byBus", data.busId, data.caravanId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "registrations",
          "count",
          "active",
          data.caravanId,
          data.busId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["waitlist", data.caravanId],
      });
      // Invalidate caravan query to refresh ordinanceCapacityCounts
      queryClient.invalidateQueries({
        queryKey: ["caravans", data.caravanId],
      });
      queryClient.invalidateQueries({
        queryKey: ["caravans"],
      });
      // Invalidate ordinance availability queries
      queryClient.invalidateQueries({
        queryKey: ["ordinance-availability"],
      });
    },
  });

  const promoteFromWaitlist = async (id: string) => {
    return mutation.mutateAsync(id);
  };

  return {
    promoteFromWaitlist,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

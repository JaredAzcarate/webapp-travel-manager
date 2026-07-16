import type { ChapelTransferWithId } from "@/features/finances/models/chapelTransfers.model";
import type {
  CaravanFinanceSummary,
  ChapelOverviewRow,
} from "@/features/finances/services/financeSummary.server";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useCaravanFinanceSummary = (caravanId: string) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["finances", "summary", caravanId],
    queryFn: async (): Promise<CaravanFinanceSummary> => {
      const response = await fetch(
        `/api/finances/summary?caravanId=${encodeURIComponent(caravanId)}`
      );
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Erro ao buscar resumo financeiro");
      }
      const result = await response.json();
      return result.summary;
    },
    enabled: !!caravanId,
  });

  return {
    summary: data,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};

export const useFinanceOverview = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["finances", "overview"],
    queryFn: async (): Promise<ChapelOverviewRow[]> => {
      const response = await fetch("/api/finances/summary?view=overview");
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Erro ao buscar visão geral");
      }
      const result = await response.json();
      return result.overview;
    },
  });

  return {
    overview: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};

export const useChapelTransfers = (caravanId: string, chapelId: string) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["finances", "transfers", caravanId, chapelId],
    queryFn: async (): Promise<ChapelTransferWithId[]> => {
      const params = new URLSearchParams({ caravanId, chapelId });
      const response = await fetch(`/api/finances/transfers?${params}`);
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Erro ao buscar transferências");
      }
      const result = await response.json();
      return result.transfers;
    },
    enabled: !!caravanId && !!chapelId,
  });

  return {
    transfers: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
};

interface CreateTransferInput {
  caravanId: string;
  chapelId: string;
  amount: number;
  transferredAt: string;
  notes?: string;
}

export const useCreateChapelTransfer = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: CreateTransferInput) => {
      const response = await fetch("/api/finances/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Erro ao registar transferência");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["finances", "transfers", variables.caravanId, variables.chapelId],
      });
      queryClient.invalidateQueries({
        queryKey: ["finances", "summary", variables.caravanId],
      });
      queryClient.invalidateQueries({ queryKey: ["finances", "overview"] });
    },
  });

  return {
    createTransfer: mutation.mutate,
    createTransferAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};

export const useDeleteChapelTransfer = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      caravanId,
      chapelId,
    }: {
      id: string;
      caravanId: string;
      chapelId: string;
    }) => {
      const response = await fetch(`/api/finances/transfers/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Erro ao eliminar transferência");
      }
      return { caravanId, chapelId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({
        queryKey: ["finances", "transfers", variables.caravanId, variables.chapelId],
      });
      queryClient.invalidateQueries({
        queryKey: ["finances", "summary", variables.caravanId],
      });
      queryClient.invalidateQueries({ queryKey: ["finances", "overview"] });
    },
  });

  return {
    deleteTransfer: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};

export const useCloseCaravanFinances = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (caravanId: string) => {
      const response = await fetch("/api/finances/close-caravan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caravanId, action: "close" }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Erro ao finalizar o acompanhamento");
      }
      return response.json();
    },
    onSuccess: (_, caravanId) => {
      queryClient.invalidateQueries({ queryKey: ["finances"] });
      queryClient.invalidateQueries({ queryKey: ["caravans", caravanId] });
      queryClient.invalidateQueries({ queryKey: ["caravans"] });
    },
  });

  return {
    closeFinances: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};

export const useReopenCaravanFinances = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (caravanId: string) => {
      const response = await fetch("/api/finances/close-caravan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caravanId, action: "reopen" }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Erro ao reabrir o acompanhamento");
      }
      return response.json();
    },
    onSuccess: (_, caravanId) => {
      queryClient.invalidateQueries({ queryKey: ["finances"] });
      queryClient.invalidateQueries({ queryKey: ["caravans", caravanId] });
      queryClient.invalidateQueries({ queryKey: ["caravans"] });
    },
  });

  return {
    reopenFinances: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
  };
};

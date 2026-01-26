import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { registrationRepository } from "../repositories/registrations.repository";
import { RegistrationWithId } from "../models/registrations.model";

export const useRegistrationByUuid = (uuid: string | null) => {
  const {
    data: registration,
    isLoading,
    error,
  } = useQuery<RegistrationWithId | null>({
    queryKey: ["registration", "uuid", uuid],
    queryFn: () => (uuid ? registrationRepository.getByUuid(uuid) : null),
    enabled: !!uuid,
  });

  return {
    registration,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

export const useExportData = () => {
  const mutation = useMutation({
    mutationFn: async (uuid: string) => {
      const response = await fetch(`/api/gdpr/export-data?uuid=${uuid}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao exportar dados");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meus-dados-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });

  return {
    exportData: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

export const useWithdrawConsent = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (uuid: string) => {
      const response = await fetch("/api/gdpr/withdraw-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao retirar consentimento");
      }

      return response.json();
    },
    onSuccess: (_, uuid) => {
      queryClient.invalidateQueries({ queryKey: ["registration", "uuid", uuid] });
    },
  });

  return {
    withdrawConsent: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

export const useDeleteAllData = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (uuid: string) => {
      const response = await fetch("/api/gdpr/delete-all-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao eliminar dados");
      }

      return response.json();
    },
    onSuccess: (_, uuid) => {
      queryClient.invalidateQueries({ queryKey: ["registration", "uuid", uuid] });
    },
  });

  return {
    deleteAllData: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

import { AdminWithId } from "@/features/auth/models/admin.model";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useAdmins = () => {
  const {
    data: admins = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admins"],
    queryFn: async (): Promise<AdminWithId[]> => {
      const response = await fetch("/api/admin");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao obter gestores");
      }
      const result = await response.json();
      return result.admins;
    },
  });

  return {
    admins,
    loading: isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao eliminar gestor");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
  });

  const deleteAdmin = async (id: string) => {
    await mutation.mutateAsync(id);
  };

  return {
    deleteAdmin,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

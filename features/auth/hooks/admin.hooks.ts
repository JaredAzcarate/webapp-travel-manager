import { adminRepository } from "@/features/auth/repositories/admin.repository";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useAdmins = () => {
  const {
    data: admins = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admins"],
    queryFn: () => adminRepository.getAll(),
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
    mutationFn: (id: string) => adminRepository.delete(id),
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

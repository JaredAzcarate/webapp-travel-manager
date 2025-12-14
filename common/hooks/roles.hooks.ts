import { useQuery } from "@tanstack/react-query";
import { RoleRepository } from "../repositories/roles.repository";

const repository = new RoleRepository();

export const useRoles = () => {
  const {
    data: roles = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["roles"],
    queryFn: () => repository.getAll(),
  });

  return {
    roles,
    loading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Erro desconhecido"
      : null,
  };
};

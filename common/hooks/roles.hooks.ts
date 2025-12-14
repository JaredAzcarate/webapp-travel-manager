import { useQuery } from "@tanstack/react-query";
import { getRoles } from "../services/roles.services";

export const useRoles = () => {
  const {
    data: roles = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  });

  return {
    roles,
    loading,
    error: error
      ? error instanceof Error
        ? error.message
        : "Error desconocido"
      : null,
  };
};

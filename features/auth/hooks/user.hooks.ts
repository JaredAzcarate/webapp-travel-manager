import { useMutation } from "@tanstack/react-query";
import { createUser as createUserService } from "../services/user.services";
import { CreateUserInput } from "../types/user.types";

export const useCreateUser = () => {
  const mutation = useMutation({
    mutationFn: (input: CreateUserInput) => createUserService(input),
  });

  const createUser = (input: CreateUserInput) => {
    mutation.mutate(input);
  };

  return {
    createUser,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

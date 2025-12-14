import { useMutation } from "@tanstack/react-query";
import { CreateUserInput } from "../models/user.model";
import { UserRepository } from "../repositories/user.repository";

const repository = new UserRepository();

export const useCreateUser = () => {
  const mutation = useMutation({
    mutationFn: (input: CreateUserInput) => repository.create(input),
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

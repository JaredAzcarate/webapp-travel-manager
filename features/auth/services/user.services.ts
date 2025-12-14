import { db } from "@/common/lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import { CreateUserInput, User } from "../types/user.types";

export const createUser = async (input: CreateUserInput): Promise<User> => {
  const docRef = await addDoc(collection(db, "users"), {
    name: input.name,
    email: input.email,
    roleId: input.roleId,
    createdAt: new Date().toISOString(),
  });

  return {
    id: docRef.id,
    ...input,
    createdAt: new Date().toISOString(),
  };
};

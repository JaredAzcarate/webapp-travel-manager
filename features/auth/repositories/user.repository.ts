import { db } from "@/common/lib/firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { CreateUserInput, UserWithId } from "../models/user.model";

export class UserRepository {
  private collectionName = "users";

  async create(input: CreateUserInput): Promise<UserWithId> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, this.collectionName), {
      name: input.name,
      email: input.email,
      roleId: input.roleId,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: docRef.id,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
  }
}

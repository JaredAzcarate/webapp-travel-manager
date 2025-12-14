import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Role } from "../types/roles.types";

export const getRoles = async (): Promise<Role[]> => {
  const snap = await getDocs(collection(db, "roles"));
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Role));
};

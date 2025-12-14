import { db } from "@/common/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { RoleWithId } from "../models/roles.model";

export class RoleRepository {
  private collectionName = "roles";

  async getAll(): Promise<RoleWithId[]> {
    const snap = await getDocs(collection(db, this.collectionName));
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RoleWithId[];
  }
}

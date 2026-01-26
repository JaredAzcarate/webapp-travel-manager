import { db } from "@/common/lib/firebase";
import { CreateDataAccessLogInput, DataAccessLogWithId } from "@/common/models/dataAccessLogs.model";
import { collection, doc, getDocs, query, setDoc, Timestamp, where } from "firebase/firestore";

export class DataAccessLogsRepository {
  private collectionName = "dataAccessLogs";

  async create(input: CreateDataAccessLogInput): Promise<DataAccessLogWithId> {
    const now = Timestamp.now();
    const logRef = doc(collection(db, this.collectionName));
    
    const logData = {
      ...input,
      accessedAt: input.accessedAt || now,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(logRef, logData);

    return {
      id: logRef.id,
      ...logData,
    } as DataAccessLogWithId;
  }

  async getByRegistrationId(registrationId: string): Promise<DataAccessLogWithId[]> {
    const q = query(
      collection(db, this.collectionName),
      where("registrationId", "==", registrationId)
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DataAccessLogWithId[];
  }
}

export const dataAccessLogsRepository = new DataAccessLogsRepository();

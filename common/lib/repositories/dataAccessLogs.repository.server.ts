import { adminDb } from '@/lib/firebase-admin';
import { CreateDataAccessLogInput, DataAccessLogWithId } from '@/common/models/dataAccessLogs.model';
import { Timestamp } from 'firebase-admin/firestore';
import { Timestamp as ClientTimestamp } from 'firebase/firestore';

export class DataAccessLogsRepositoryServer {
  private collectionName = 'dataAccessLogs';

  private convertAdminTimestampToClient(adminTimestamp: any): ClientTimestamp {
    if (!adminTimestamp) return adminTimestamp;
    if (adminTimestamp.toDate) {
      return ClientTimestamp.fromDate(adminTimestamp.toDate());
    }
    return adminTimestamp;
  }

  async create(input: CreateDataAccessLogInput): Promise<DataAccessLogWithId> {
    const now = Timestamp.now();
    
    const logData = {
      ...input,
      accessedAt: input.accessedAt || now,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection(this.collectionName).add(logData);

    return {
      id: docRef.id,
      ...logData,
      accessedAt: this.convertAdminTimestampToClient(logData.accessedAt),
      createdAt: this.convertAdminTimestampToClient(logData.createdAt),
      updatedAt: this.convertAdminTimestampToClient(logData.updatedAt),
    } as DataAccessLogWithId;
  }

  async getByRegistrationId(registrationId: string): Promise<DataAccessLogWithId[]> {
    const snapshot = await adminDb
      .collection(this.collectionName)
      .where('registrationId', '==', registrationId)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        accessedAt: this.convertAdminTimestampToClient(data.accessedAt),
        createdAt: this.convertAdminTimestampToClient(data.createdAt),
        updatedAt: this.convertAdminTimestampToClient(data.updatedAt),
      };
    }) as DataAccessLogWithId[];
  }
}

export const dataAccessLogsRepositoryServer = new DataAccessLogsRepositoryServer();

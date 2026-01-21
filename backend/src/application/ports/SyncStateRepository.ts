export interface SyncStateRepository {
  getLastSyncedDate(fundCode: string): Promise<Date | null>;
  updateLastSyncedDate(fundCode: string, date: Date): Promise<void>;
}

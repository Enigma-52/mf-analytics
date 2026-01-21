import { MfApiClient } from "../ports/MfApiClient";
import { NavRepository } from "../ports/NavRepository";
import { SyncStateRepository } from "../ports/SyncStateRepository";
import { FundRepository } from "../ports/FundRepository";

export class SyncAllFunds {
  constructor(
    private fundRepo: FundRepository,
    private mfapi: MfApiClient,
    private navRepo: NavRepository,
    private syncStateRepo: SyncStateRepository,
  ) {}

  async runOnce(): Promise<void> {
    const allFunds = await this.fundRepo.getAllFunds();

    for (const fund of allFunds) {
      console.log(`Syncing fund ${fund.code}...`);

      const lastSynced = await this.syncStateRepo.getLastSyncedDate(fund.code);

      const fullHistory = await this.mfapi.fetchFullHistory(fund.code);

      const newRows = fullHistory.filter((row) => {
        if (!lastSynced) return true;
        return row.date > lastSynced;
      });

      newRows.sort((a, b) => a.date.getTime() - b.date.getTime());

      await this.navRepo.bulkUpsert(fund.code, newRows);

      if (newRows.length > 0) {
        const maxDate = newRows[newRows.length - 1].date;
        await this.syncStateRepo.updateLastSyncedDate(fund.code, maxDate);
      }

      console.log(`Fund ${fund.code}: inserted ${newRows.length} rows`);
    }
  }
}

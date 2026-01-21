import { db } from "../db";
import { syncState } from "../db/schema";
import { SyncStateRepository } from "../../application/ports/SyncStateRepository";
import { eq } from "drizzle-orm";

function toPgDate(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export class DrizzleSyncStateRepository implements SyncStateRepository {
  async getLastSyncedDate(fundCode: string): Promise<Date | null> {
    const rows = await db
      .select()
      .from(syncState)
      .where(eq(syncState.fundCode, fundCode));

    if (rows.length === 0) return null;
    return rows[0].lastSyncedDate ? new Date(rows[0].lastSyncedDate) : null;
  }

  async updateLastSyncedDate(fundCode: string, date: Date): Promise<void> {
    await db
      .insert(syncState)
      .values({
        fundCode,
        lastSyncedDate: toPgDate(date),
      })
      .onConflictDoUpdate({
        target: syncState.fundCode,
        set: {
          lastSyncedDate: toPgDate(date),
          updatedAt: new Date(),
        },
      });
  }
}

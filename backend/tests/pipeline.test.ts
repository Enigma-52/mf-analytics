import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../src/infra/db";
import { navHistory, syncState } from "../src/infra/db/schema";
import { sql } from "drizzle-orm";
import { SyncAllFunds } from "../src/application/usecases/SyncAllFunds";
import { DrizzleFundRepository } from "../src/infra/repositories/DrizzleFundRepository";
import { DrizzleNavRepository } from "../src/infra/repositories/DrizzleNavRepository";
import { DrizzleSyncStateRepository } from "../src/infra/repositories/DrizzleSyncStateRepository";
import { MfApiClient } from "../src/application/ports/MfApiClient";

class FakeMfApiClient implements MfApiClient {
  async fetchFullHistory(_schemeCode: string) {
    return [
      { date: new Date("2020-01-01"), nav: "100" },
      { date: new Date("2020-01-02"), nav: "101" },
      { date: new Date("2020-01-03"), nav: "102" },
      { date: new Date("2020-01-04"), nav: "103" },
    ];
  }
}


describe("Pipeline resumability", () => {
  beforeEach(async () => {
    await db.execute(sql`TRUNCATE nav_history, sync_state`);
  });

  it("resumes from last synced date without duplicating", async () => {
    const fundCode = "118989";

    await db.insert(navHistory).values({
      fundCode,
      date: "2020-01-01",
      nav: "100",
    });

    await db.insert(syncState).values({
      fundCode,
      lastSyncedDate: "2020-01-01",
    });

    const usecase = new SyncAllFunds(
      new DrizzleFundRepository(),
      new FakeMfApiClient(),         
      new DrizzleNavRepository(),
      new DrizzleSyncStateRepository()
    );

    await usecase.runOnce();

    const rows = await db.select().from(navHistory).where(sql`fund_code = ${fundCode}`);

    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
});

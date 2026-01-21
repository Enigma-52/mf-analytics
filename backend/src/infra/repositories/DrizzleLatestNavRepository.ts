import { db } from "../db";
import { fundLatestNav } from "../db/schema";

function toPgDate(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export class DrizzleLatestNavRepository {
  async upsertLatest(fundCode: string, date: Date, nav: string) {
    const pgDate = toPgDate(date);

    await db
      .insert(fundLatestNav)
      .values({
        fundCode,
        date: pgDate,   // ✅ FIX HERE
        nav,
      })
      .onConflictDoUpdate({
        target: fundLatestNav.fundCode,
        set: {
          date: pgDate, // ✅ FIX HERE TOO
          nav,
          updatedAt: new Date(),
        },
      });
  }
}

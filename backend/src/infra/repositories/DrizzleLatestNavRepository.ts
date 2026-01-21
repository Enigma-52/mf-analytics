import { db } from "../db";
import { fundLatestNav } from "../db/schema";

function toPgDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export class DrizzleLatestNavRepository {
  async upsertLatest(fundCode: string, date: Date, nav: string) {
    const pgDate = toPgDate(date);

    await db
      .insert(fundLatestNav)
      .values({
        fundCode,
        date: pgDate, 
        nav,
      })
      .onConflictDoUpdate({
        target: fundLatestNav.fundCode,
        set: {
          date: pgDate,
          nav,
          updatedAt: new Date(),
        },
      });
  }
}

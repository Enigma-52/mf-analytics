import { db } from "../db";
import { navHistory } from "../db/schema";
import { NavRepository } from "../../application/ports/NavRepository";
import { NavPoint } from "../../application/ports/MfApiClient";
import { eq, asc } from "drizzle-orm";

function toPgDate(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export class DrizzleNavRepository implements NavRepository {
  async bulkUpsert(fundCode: string, rows: NavPoint[]): Promise<void> {
    if (rows.length === 0) return;

    const values = rows.map((r) => ({
      fundCode,
      date: toPgDate(r.date),   // ✅ convert
      nav: r.nav,
    }));

    await db.insert(navHistory).values(values).onConflictDoNothing();
  }

  async getAllForFund(fundCode: string): Promise<{ date: Date; nav: string }[]> {
    const rows = await db
      .select({
        date: navHistory.date,
        nav: navHistory.nav,
      })
      .from(navHistory)
      .where(eq(navHistory.fundCode, fundCode))
      .orderBy(asc(navHistory.date));

    // navHistory.date is returned as string YYYY-MM-DD → convert to Date
    return rows.map((r) => ({
      date: new Date(r.date + "T00:00:00Z"),
      nav: r.nav,
    }))
  }
}

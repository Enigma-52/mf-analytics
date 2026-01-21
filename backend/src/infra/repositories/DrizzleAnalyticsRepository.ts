import { db } from "../db";
import { fundAnalytics } from "../db/schema";

function toPgDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export class DrizzleAnalyticsRepository {
  async upsert(row: {
    fundCode: string;
    window: string;

    rollingMin: number;
    rollingMax: number;
    rollingMedian: number;
    rollingP25: number;
    rollingP75: number;

    maxDrawdown: number;

    cagrMin: number;
    cagrMax: number;
    cagrMedian: number;

    dataStartDate: Date;
    dataEndDate: Date;
    navPoints: number;
  }) {
    await db
      .insert(fundAnalytics)
      .values({
        fundCode: row.fundCode,
        window: row.window,

        rollingMin: row.rollingMin.toString(),
        rollingMax: row.rollingMax.toString(),
        rollingMedian: row.rollingMedian.toString(),
        rollingP25: row.rollingP25.toString(),
        rollingP75: row.rollingP75.toString(),

        maxDrawdown: row.maxDrawdown.toString(),

        cagrMin: row.cagrMin.toString(),
        cagrMax: row.cagrMax.toString(),
        cagrMedian: row.cagrMedian.toString(),

        dataStartDate: toPgDate(row.dataStartDate),
        dataEndDate: toPgDate(row.dataEndDate),
        navPoints: row.navPoints.toString(),   // ✅ FIX

        computedAt: new Date(), // timestamp is OK
      })
      .onConflictDoUpdate({
        target: [fundAnalytics.fundCode, fundAnalytics.window],
        set: {
          rollingMin: row.rollingMin.toString(),
          rollingMax: row.rollingMax.toString(),
          rollingMedian: row.rollingMedian.toString(),
          rollingP25: row.rollingP25.toString(),
          rollingP75: row.rollingP75.toString(),

          maxDrawdown: row.maxDrawdown.toString(),

          cagrMin: row.cagrMin.toString(),
          cagrMax: row.cagrMax.toString(),
          cagrMedian: row.cagrMedian.toString(),

          dataStartDate: toPgDate(row.dataStartDate),
          dataEndDate: toPgDate(row.dataEndDate),
          navPoints: row.navPoints.toString(),  // ✅ FIX

          computedAt: new Date(),
        },
      });
  }
}

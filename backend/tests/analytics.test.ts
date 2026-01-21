import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../src/infra/db";
import {
  navHistory,
  fundAnalytics,
  fundLatestNav,
  funds,
} from "../src/infra/db/schema";
import { ComputeFundAnalytics } from "../src/application/usecases/ComputeFundAnalytics";
import { DrizzleNavRepository } from "../src/infra/repositories/DrizzleNavRepository";
import { DrizzleLatestNavRepository } from "../src/infra/repositories/DrizzleLatestNavRepository";
import { DrizzleAnalyticsRepository } from "../src/infra/repositories/DrizzleAnalyticsRepository";
import { sql } from "drizzle-orm";

describe("Analytics correctness", () => {
  beforeEach(async () => {
    // Clean all touched tables
    await db.execute(
      sql`TRUNCATE nav_history, fund_latest_nav, fund_analytics, funds`
    );

    // Insert test fund
    await db.insert(funds).values({
      code: "TEST1",
      name: "Test Fund",
      amc: "Test AMC",
      category: "Test Category",
    });
  });

  it("computes correct CAGR and zero drawdown for monotonic series", async () => {
    const fundCode = "TEST1";

    // 100 → 121 over 2 years ≈ 10% CAGR
    const rows = [];
    let nav = 100;

    for (let i = 0; i < 60; i++) { // 5 years monthly
      const d = new Date(2018, i, 1);
      nav = nav * 1.01; // 1% per month
      rows.push({
        d: d.toISOString().slice(0, 10),
        v: nav.toFixed(4),
      });
    }


    for (const r of rows) {
      await db.insert(navHistory).values({
        fundCode,
        date: r.d,
        nav: r.v,
      });
    }

    const compute = new ComputeFundAnalytics(
      new DrizzleNavRepository(),
      new DrizzleLatestNavRepository(),
      new DrizzleAnalyticsRepository()
    );

    await compute.runForFund(fundCode);

    const res = await db.select().from(fundAnalytics);

    expect(res.length).toBeGreaterThan(0);

    const a = res[0];

    // Max drawdown should be 0 for monotonic increasing series
    expect(a.maxDrawdown).not.toBeNull();
    expect(parseFloat(a.maxDrawdown!)).toBeCloseTo(0, 5);

    // CAGR should be around 10%
    expect(a.cagrMedian).not.toBeNull();
    expect(parseFloat(a.cagrMedian!)).toBeGreaterThan(9);
    expect(parseFloat(a.cagrMedian!)).toBeLessThan(15);
  });
});

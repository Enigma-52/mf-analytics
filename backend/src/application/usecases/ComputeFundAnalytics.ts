import { DrizzleNavRepository } from "../../infra/repositories/DrizzleNavRepository";
import { DrizzleLatestNavRepository } from "../../infra/repositories/DrizzleLatestNavRepository";
import { DrizzleAnalyticsRepository } from "../../infra/repositories/DrizzleAnalyticsRepository";
import { percentile, median } from "../analytics/stats";

const WINDOWS: Record<string, number> = {
  "1Y": 365,
  "3Y": 365 * 3,
  "5Y": 365 * 5,
  "10Y": 365 * 10,
};

function finite(x: number): number | null {
  if (!Number.isFinite(x) || Number.isNaN(x)) return null;
  return x;
}

export class ComputeFundAnalytics {
  constructor(
    private navRepo: DrizzleNavRepository,
    private latestRepo: DrizzleLatestNavRepository,
    private analyticsRepo: DrizzleAnalyticsRepository
  ) {}

  async runForFund(fundCode: string) {
    const navs = await this.navRepo.getAllForFund(fundCode);
    if (navs.length === 0) return;

    // Ensure sorted ascending
    navs.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Update latest NAV snapshot
    const last = navs[navs.length - 1];
    await this.latestRepo.upsertLatest(fundCode, last.date, last.nav);

    for (const [windowName, windowDays] of Object.entries(WINDOWS)) {
      await this.computeWindow(fundCode, navs, windowName, windowDays);
    }
  }

  private async computeWindow(
    fundCode: string,
    navs: { date: Date; nav: string }[],
    windowName: string,
    windowDays: number
  ) {
    /* ================= ROLLING RETURNS ================= */

    const returns: number[] = [];

    let j = 0;

    for (let i = 0; i < navs.length; i++) {
      const startDate = navs[i].date.getTime();
      const target = startDate + windowDays * 86400_000;

      // advance j until date[j] >= target
      while (j < navs.length && navs[j].date.getTime() < target) {
        j++;
      }

      if (j >= navs.length) break;

      const start = parseFloat(navs[i].nav);
      const end = parseFloat(navs[j].nav);

      if (start > 0 && end > 0) {
        const ret = ((end / start) - 1) * 100;
        if (Number.isFinite(ret)) {
          returns.push(ret);
        }
      }
    }

    if (returns.length < 5) {
      console.warn(`Skipping ${fundCode} ${windowName}: insufficient rolling data`);
      return;
    }

    returns.sort((a, b) => a - b);

    const rollingMin = returns[0];
    const rollingMax = returns[returns.length - 1];
    const rollingMedian = median(returns);
    const rollingP25 = percentile(returns, 0.25);
    const rollingP75 = percentile(returns, 0.75);

    /* ================= MAX DRAWDOWN ================= */

    let peak = parseFloat(navs[0].nav);
    let maxDrawdown = 0;

    if (peak > 0) {
      for (const row of navs) {
        const v = parseFloat(row.nav);
        if (v > peak) peak = v;

        if (peak > 0) {
          const dd = ((v - peak) / peak) * 100;
          const safe = finite(dd);
          if (safe !== null && safe < maxDrawdown) {
            maxDrawdown = safe;
          }
        }
      }
    }

    /* ================= CAGR DISTRIBUTION ================= */

    const cagr: number[] = [];

    const endNav = parseFloat(navs[navs.length - 1].nav);
    const endDate = navs[navs.length - 1].date.getTime();

    for (let i = 0; i < navs.length - 1; i++) {
      const startNav = parseFloat(navs[i].nav);
      const startDate = navs[i].date.getTime();

      const years = (endDate - startDate) / (365 * 86400_000);

      if (startNav > 0 && endNav > 0 && years > 0.5) {
        const val = (Math.pow(endNav / startNav, 1 / years) - 1) * 100;
        const safe = finite(val);
        if (safe !== null) cagr.push(safe);
      }
    }

    if (cagr.length === 0) {
      console.warn(`Skipping ${fundCode} ${windowName}: no valid CAGR values`);
      return;
    }

    cagr.sort((a, b) => a - b);

    const cagrMin = cagr[0];
    const cagrMax = cagr[cagr.length - 1];
    const cagrMedian = median(cagr);

    /* ================= FINAL SAFETY CHECK ================= */

    const all = [
      rollingMin, rollingMax, rollingMedian, rollingP25, rollingP75,
      maxDrawdown,
      cagrMin, cagrMax, cagrMedian,
    ];

    if (all.some(v => !Number.isFinite(v) || Number.isNaN(v))) {
      console.warn(`Skipping ${fundCode} ${windowName}: invalid aggregate detected`);
      return;
    }

    /* ================= WRITE TO DB ================= */

    await this.analyticsRepo.upsert({
      fundCode,
      window: windowName,

      rollingMin,
      rollingMax,
      rollingMedian,
      rollingP25,
      rollingP75,

      maxDrawdown,

      cagrMin,
      cagrMax,
      cagrMedian,

      dataStartDate: navs[0].date,
      dataEndDate: navs[navs.length - 1].date,
      navPoints: navs.length,
    });
  }
}

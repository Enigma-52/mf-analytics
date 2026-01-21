import { db } from "../db";
import { funds, fundLatestNav, fundAnalytics } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

export class DrizzleFundReadRepository {
  async listFunds(filter?: { category?: string; amc?: string }) {
    const where = and(
      filter?.category ? eq(funds.category, filter.category) : undefined,
      filter?.amc ? eq(funds.amc, filter.amc) : undefined
    );

    return db
    .select({
      code: funds.code,
      name: funds.name,
      amc: funds.amc,
      category: funds.category,
      nav: fundLatestNav.nav,
      date: fundLatestNav.date,
    })
    .from(funds)
    .leftJoin(fundLatestNav, eq(fundLatestNav.fundCode, funds.code))
    .where(where)
    .orderBy(funds.name)
    .then(rows =>
      rows.map(r => ({
        code: r.code,
        name: r.name,
        amc: r.amc,
        category: r.category,
        latest_nav: r.nav
          ? { nav: r.nav, date: r.date }
          : null,
      }))
    );
  }

  async getFund(code: string) {
  const rows = await db
    .select({
      code: funds.code,
      name: funds.name,
      amc: funds.amc,
      category: funds.category,
      nav: fundLatestNav.nav,
      date: fundLatestNav.date,
    })
    .from(funds)
    .leftJoin(fundLatestNav, eq(fundLatestNav.fundCode, funds.code))
    .where(eq(funds.code, code))
    .limit(1);

  const r = rows[0];
  if (!r) return null;

  return {
    code: r.code,
    name: r.name,
    amc: r.amc,
    category: r.category,
    latest_nav: r.nav
      ? {
          nav: r.nav,
          date: r.date,
        }
      : null,
  };
}



  async getAnalytics(code: string, window: string) {
    const rows = await db.execute(sql`
    SELECT
      f.code,
      f.name,
      f.category,
      f.amc,
      a.*
    FROM fund_analytics a
    JOIN funds f ON f.code = a.fund_code
    WHERE a.fund_code = ${code} AND a.window = ${window}
    LIMIT 1
  `);

  return rows.rows[0] ?? null;
  }

  async rank(
    category: string,
    window: string,
    sortBy: "median_return" | "max_drawdown",
    limit: number
    ) {
    const orderBy =
        sortBy === "median_return"
        ? sql`a.rolling_median DESC`
        : sql`a.max_drawdown ASC`;

    return db.execute(sql`
        SELECT
        f.code, f.name, f.amc, f.category,
        a.rolling_median, a.max_drawdown,
        l.nav, l.date
        FROM fund_analytics a
        JOIN funds f ON f.code = a.fund_code
        JOIN fund_latest_nav l ON l.fund_code = f.code
        WHERE f.category = ${category} AND a.window = ${window}
        ORDER BY ${orderBy}
        LIMIT ${limit}
    `);
    }
}

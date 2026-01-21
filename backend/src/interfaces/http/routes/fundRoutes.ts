import type { Express } from "express";
import type { AnalyticsRow } from "../../../types/analytics";
import { DrizzleFundReadRepository } from "../../../infra/repositories/DrizzleFundReadRepository";

export function registerFundRoutes(app: Express) {
  const fundReadRepo = new DrizzleFundReadRepository();

  app.get("/funds", async (req, res) => {
    const { category, amc } = req.query;
    const rows = await fundReadRepo.listFunds({
      category: category as string | undefined,
      amc: amc as string | undefined,
    });
    res.json(rows);
  });

  app.get("/funds/rank", async (req, res) => {
    const { category, window, sort_by, limit } = req.query;

    if (!category || !window || !sort_by) {
      return res.status(400).json({ error: "category, window, sort_by required" });
    }

    const lim = limit ? Number(limit) : 5;
    const result = await fundReadRepo.rank(
      category as string,
      window as string,
      sort_by as any,
      lim
    );

    const rows = result.rows || result;
    const funds = (Array.isArray(rows) ? rows : []).map((r: any, idx: number) => ({
      rank: idx + 1,
      fund_code: r.code,
      fund_name: r.name,
      amc: r.amc,
      ...(sort_by === "median_return" && { [`median_return_${window}`]: Number(r.rolling_median) }),
      ...(sort_by === "max_drawdown" && { [`max_drawdown_${window}`]: Number(r.max_drawdown) }),
      current_nav: Number(r.nav),
      last_updated: r.date,
    }));

    res.json({
      category,
      window,
      sorted_by: sort_by,
      total_funds: rows.length,
      showing: funds.length,
      funds,
    });
  });

  app.get("/funds/:code", async (req, res) => {
    const row = await fundReadRepo.getFund(req.params.code);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  });

  app.get("/funds/:code/analytics", async (req, res) => {
    const window = req.query.window as string;
    if (!window) return res.status(400).json({ error: "window required" });

    const r = (await fundReadRepo.getAnalytics(req.params.code, window)) as AnalyticsRow | null;
    if (!r) return res.status(404).json({ error: "NOT_COMPUTED" });

    const totalDays = Math.round((new Date(r.data_end_date).getTime() - new Date(r.data_start_date).getTime()) / 86400000);

    res.json({
      fund_code: r.code,
      fund_name: r.name,
      category: r.category,
      amc: r.amc,
      window,
      data_availability: {
        start_date: r.data_start_date,
        end_date: r.data_end_date,
        total_days: totalDays,
        nav_data_points: r.nav_points,
      },
      rolling_returns: {
        min: Number(r.rolling_min),
        max: Number(r.rolling_max),
        median: Number(r.rolling_median),
        p25: Number(r.rolling_p25),
        p75: Number(r.rolling_p75),
      },
      max_drawdown: Number(r.max_drawdown),
      cagr: {
        min: Number(r.cagr_min),
        max: Number(r.cagr_max),
        median: Number(r.cagr_median),
      },
      computed_at: r.computed_at,
    });
  });
}
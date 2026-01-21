export type AnalyticsRow = {
  code: string;
  name: string;
  category: string;
  amc: string;

  data_start_date: string;
  data_end_date: string;
  nav_points: number;

  rolling_min: string | null;
  rolling_max: string | null;
  rolling_median: string | null;
  rolling_p25: string | null;
  rolling_p75: string | null;

  max_drawdown: string | null;

  cagr_min: string | null;
  cagr_max: string | null;
  cagr_median: string | null;

  computed_at: string;
};

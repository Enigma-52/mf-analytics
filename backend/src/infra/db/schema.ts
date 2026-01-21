import {
  pgTable,
  text,
  date,
  numeric,
  timestamp,
  jsonb,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";


export const funds = pgTable("funds", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  amc: text("amc").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const navHistory = pgTable(
  "nav_history",
  {
    fundCode: text("fund_code").notNull(),
    date: date("date").notNull(),
    nav: numeric("nav", { precision: 20, scale: 5 }).notNull(),  // ✅ FIXED
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.fundCode, t.date] }),
    fundDateIdx: index("nav_fund_date_idx").on(t.fundCode, t.date),
  })
);

export const syncState = pgTable("sync_state", {
  fundCode: text("fund_code").primaryKey(),
  lastSyncedDate: date("last_synced_date"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fundLatestNav = pgTable("fund_latest_nav", {
  fundCode: text("fund_code").primaryKey().references(() => funds.code),
  date: date("date").notNull(),
  nav: numeric("nav", { precision: 20, scale: 5 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fundAnalytics = pgTable(
  "fund_analytics",
  {
    fundCode: text("fund_code").notNull().references(() => funds.code),
    window: text("window").notNull(),

    rollingMin: numeric("rolling_min", { precision: 10, scale: 4 }),
    rollingMax: numeric("rolling_max", { precision: 10, scale: 4 }),
    rollingMedian: numeric("rolling_median", { precision: 10, scale: 4 }),
    rollingP25: numeric("rolling_p25", { precision: 10, scale: 4 }),
    rollingP75: numeric("rolling_p75", { precision: 10, scale: 4 }),

    maxDrawdown: numeric("max_drawdown", { precision: 10, scale: 4 }),

    cagrMin: numeric("cagr_min", { precision: 10, scale: 4 }),
    cagrMax: numeric("cagr_max", { precision: 10, scale: 4 }),
    cagrMedian: numeric("cagr_median", { precision: 10, scale: 4 }),

    dataStartDate: date("data_start_date"),
    dataEndDate: date("data_end_date"),
    navPoints: numeric("nav_points"),
    computedAt: timestamp("computed_at").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.fundCode, t.window] }),
    index("fund_analytics_window_idx").on(t.window),
  ]
);
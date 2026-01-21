import type { Express } from "express";
import { registerSyncRoutes } from "./routes/syncRoutes";
import { registerFundRoutes } from "./routes/fundRoutes";

export function registerRoutes(app: Express) {
  app.get("/health", (_req, res) => res.json({ ok: true }));
  registerSyncRoutes(app);
  registerFundRoutes(app);
}
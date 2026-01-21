import type { Express } from "express";
import { SyncAllFunds } from "../../../application/usecases/SyncAllFunds";
import { ComputeAllFundsAnalytics } from "../../../application/usecases/ComputeAllFundsAnalytics";
import { ComputeFundAnalytics } from "../../../application/usecases/ComputeFundAnalytics";
import { MfApiHttpClient } from "../MfApiHttpClient";
import { DrizzleFundRepository } from "../../../infra/repositories/DrizzleFundRepository";
import { DrizzleNavRepository } from "../../../infra/repositories/DrizzleNavRepository";
import { DrizzleSyncStateRepository } from "../../../infra/repositories/DrizzleSyncStateRepository";
import { DrizzleLatestNavRepository } from "../../../infra/repositories/DrizzleLatestNavRepository";
import { DrizzleAnalyticsRepository } from "../../../infra/repositories/DrizzleAnalyticsRepository";
import { getLimiter } from "../../../infra/ratelimit/rateLimiterSingleton";

let pipelineState = {
  running: false,
  lastSyncAt: null as Date | null,
};

export function registerSyncRoutes(app: Express) {
  app.post("/sync/trigger", async (_req, res) => {
    if (pipelineState.running) {
      return res.status(409).json({ error: "Sync already running" });
    }

    pipelineState.running = true;

    try {
      const limiter = await getLimiter();
      const fundRepo = new DrizzleFundRepository();
      const navRepo = new DrizzleNavRepository();

      const syncUsecase = new SyncAllFunds(
        fundRepo,
        new MfApiHttpClient(limiter),
        navRepo,
        new DrizzleSyncStateRepository()
      );

      await syncUsecase.runOnce();

      const computeAll = new ComputeAllFundsAnalytics(
        fundRepo,
        new ComputeFundAnalytics(
          navRepo,
          new DrizzleLatestNavRepository(),
          new DrizzleAnalyticsRepository()
        )
      );

      await computeAll.runOnce();
      pipelineState.lastSyncAt = new Date();

      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Pipeline failed" });
    } finally {
      pipelineState.running = false;
    }
  });

  app.get("/sync/status", (_req, res) => {
    res.json({
      running: pipelineState.running,
      last_sync_at: pipelineState.lastSyncAt,
    });
  });
}
import express from "express";
import { registerRoutes } from "./interfaces/http/routes";


export async function createApp() {
  const app = express();
  app.use(express.json());

  const p = 5;

  registerRoutes(app);

  return app;
}

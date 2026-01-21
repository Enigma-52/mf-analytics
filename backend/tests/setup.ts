import { beforeAll } from "vitest";
import { redis } from "../src/infra/redis";
import { db } from "../src/infra/db";

beforeAll(async () => {
  await redis.ping();
  await db.execute("select 1");
});

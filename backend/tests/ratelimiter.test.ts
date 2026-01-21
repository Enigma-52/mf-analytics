import { describe, it, expect, beforeEach } from "vitest";
import { RedisRateLimiter } from "../src/infra/ratelimit/RedisRateLimiter";
import { redis } from "../src/infra/redis";

describe("RedisRateLimiter", () => {
  beforeEach(async () => {
    await redis.flushdb();
  });

  it("enforces per-second limit by delaying", async () => {
    const limiter = new RedisRateLimiter(
      redis,
      { perSecond: 2, perMinute: 100, perHour: 100 },
      "test",
      true // testMode
    );
    await limiter.init();

    await limiter.acquire(1);
    await limiter.acquire(1);

    const start = Date.now();
    await limiter.acquire(1); // should wait
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThan(0);
  });

  it("persists state across instances", async () => {
  const limiter1 = new RedisRateLimiter(
    redis,
    { perSecond: 2, perMinute: 100, perHour: 100 },
    "test",
    true // testMode
  );
  await limiter1.init();

  await limiter1.acquire(2); // fills second bucket

  const limiter2 = new RedisRateLimiter(
    redis,
    { perSecond: 2, perMinute: 100, perHour: 100 },
    "test",
    true
  );
  await limiter2.init();

  const start = Date.now();
  await limiter2.acquire(1); // must wait for next second
  const elapsed = Date.now() - start;

  expect(elapsed).toBeGreaterThan(0);
});


  it("handles concurrency safely", async () => {
    const limiter = new RedisRateLimiter(
      redis,
      { perSecond: 3, perMinute: 100, perHour: 100 },
      "test",
      true
    );
    await limiter.init();

    const start = Date.now();

    await Promise.all([
      limiter.acquire(1),
      limiter.acquire(1),
      limiter.acquire(1),
      limiter.acquire(1), // one must wait
    ]);

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThan(0);
  });
});

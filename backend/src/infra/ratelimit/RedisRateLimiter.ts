import Redis from "ioredis";
import fs from "node:fs";
import path from "node:path";
import { RateLimiter } from "../../application/ports/RateLimiter";

type Limits = {
  perSecond: number;
  perMinute: number;
  perHour: number;
};

export class RedisRateLimiter implements RateLimiter {
  private sha!: string;

  constructor(
    private redis: Redis,
    private limits: Limits,
    private keyPrefix = "rl",
    private testMode = false 
  ) {}

  async init(): Promise<void> {
    const luaPath = path.join(__dirname, "redisRateLimit.lua");
    const script = fs.readFileSync(luaPath, "utf8");
    const result = await this.redis.script("LOAD", script);
    this.sha = result as unknown as string;
  }

  async acquire(cost: number): Promise<void> {
    const now = Date.now();

    const secBucket = Math.floor(now / 1000);
    const minBucket = Math.floor(now / (60 * 1000));
    const hourBucket = Math.floor(now / (60 * 60 * 1000));

    const secKey = `${this.keyPrefix}:sec:${secBucket}`;
    const minKey = `${this.keyPrefix}:min:${minBucket}`;
    const hourKey = `${this.keyPrefix}:hour:${hourBucket}`;

    const raw = await this.redis.evalsha(
        this.sha,
        3,
        secKey,
        minKey,
        hourKey,
        String(cost),
        String(this.limits.perSecond),
        String(this.limits.perMinute),
        String(this.limits.perHour),
        "1",
        "60",
        "3600"
    );

    const [allowed, retryAfterMs] = raw as unknown as [number, number];

    if (allowed === 1) {
        return;
    }

    const sleepMs = Math.max(retryAfterMs, 50);

    console.warn(
        `[RateLimiter] BLOCKED. Sleeping ${sleepMs}ms (sec=${secBucket}, min=${minBucket}, hour=${hourBucket})`
    );

    await new Promise((r) => setTimeout(r, sleepMs));
    return this.acquire(cost);
  }

  private async block(waitMs: number) {
    if (this.testMode) {
      throw new Error("RATE_LIMITED");
    }
    await new Promise((r) => setTimeout(r, waitMs));
  }
}

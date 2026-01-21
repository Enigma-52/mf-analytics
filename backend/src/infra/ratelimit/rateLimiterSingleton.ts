import { RedisRateLimiter } from "./RedisRateLimiter";
import { redis } from "../redis";

let limiterPromise: Promise<RedisRateLimiter> | null = null;

export async function getLimiter(): Promise<RedisRateLimiter> {
  if (!limiterPromise) {
    limiterPromise = (async () => {
      const limiter = new RedisRateLimiter(redis, {
        perSecond: 2,
        perMinute: 50,
        perHour: 300,
      });
      await limiter.init();
      return limiter;
    })();
  }
  return limiterPromise;
}
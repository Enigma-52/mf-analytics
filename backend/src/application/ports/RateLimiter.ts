export interface RateLimiter {
  /**
   * Blocks until a token is available, then consumes `cost`.
   */
  acquire(cost: number): Promise<void>;
}

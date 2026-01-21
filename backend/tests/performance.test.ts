import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

const appPromise = createApp();

async function timed(req: Promise<any>) {
  const start = Date.now();
  const res = await req;
  const elapsed = Date.now() - start;
  return { res, elapsed };
}

describe("Public API performance + correctness", () => {
  it("GET /funds", async () => {
    const app = await appPromise;

    const { res, elapsed } = await timed(
      request(app).get("/funds").expect(200)
    );

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(200);
  });

  it("GET /funds?category=...", async () => {
    const app = await appPromise;

    const { res, elapsed } = await timed(
      request(app)
        .get("/funds?category=Mid%20Cap%20Direct%20Growth")
        .expect(200)
    );

    expect(Array.isArray(res.body)).toBe(true);
    expect(elapsed).toBeLessThan(200);
  });

  it("GET /funds/{code}", async () => {
    const app = await appPromise;

    const list = await request(app).get("/funds").expect(200);
    const code = list.body[0].code;

    const { res, elapsed } = await timed(
      request(app).get(`/funds/${code}`).expect(200)
    );

    expect(res.body.code).toBe(code);
    expect(res.body.latest_nav).toBeTruthy();
    expect(res.body.latest_nav.nav).toBeDefined();
    expect(res.body.latest_nav.date).toBeDefined();
    expect(elapsed).toBeLessThan(200);
  });

  it("GET /funds/{code}/analytics", async () => {
    const app = await appPromise;

    const list = await request(app).get("/funds").expect(200);
    const code = list.body[0].code;

    const { res, elapsed } = await timed(
      request(app)
        .get(`/funds/${code}/analytics?window=3Y`)
        .expect(200)
    );

    expect(res.body.window).toBe("3Y");

    expect(res.body.rolling_returns).toEqual(
      expect.objectContaining({
        min: expect.any(Number),
        max: expect.any(Number),
        median: expect.any(Number),
        p25: expect.any(Number),
        p75: expect.any(Number),
      })
    );

    expect(res.body.max_drawdown).toEqual(expect.any(Number));

    expect(res.body.cagr).toEqual(
      expect.objectContaining({
        min: expect.any(Number),
        max: expect.any(Number),
        median: expect.any(Number),
      })
    );

    expect(elapsed).toBeLessThan(200);
  });

  it("GET /funds/rank", async () => {
    const app = await appPromise;

    const { res, elapsed } = await timed(
      request(app)
        .get(
          "/funds/rank?category=Mid%20Cap%20Direct%20Growth&window=3Y&sort_by=median_return"
        )
        .expect(200)
    );

    expect(res.body.category).toBeDefined();
    expect(res.body.window).toBe("3Y");
    expect(res.body.sorted_by).toBe("median_return");

    expect(Array.isArray(res.body.funds)).toBe(true);
    expect(res.body.funds.length).toBeGreaterThan(0);

    const f = res.body.funds[0];
    expect(f.rank).toBeGreaterThan(0);
    expect(f.fund_code).toBeDefined();
    expect(f.current_nav).toBeDefined();

    expect(elapsed).toBeLessThan(200);
  });

  it("GET /sync/status", async () => {
    const app = await appPromise;

    const { res, elapsed } = await timed(
      request(app).get("/sync/status").expect(200)
    );

    expect(typeof res.body.running).toBe("boolean");
    expect(elapsed).toBeLessThan(200);
  });
});

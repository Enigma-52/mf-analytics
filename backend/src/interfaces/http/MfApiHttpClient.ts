import { MfApiClient, NavPoint } from "../../application/ports/MfApiClient";
import { RateLimiter } from "../../application/ports/RateLimiter"; 

export class MfApiHttpClient implements MfApiClient {
  private baseUrl = "https://api.mfapi.in";

  constructor(private limiter: RateLimiter) {}

  async fetchFullHistory(schemeCode: string): Promise<NavPoint[]> {
    await this.limiter.acquire(1); 

    const res = await fetch(`${this.baseUrl}/mf/${schemeCode}`);

    if (!res.ok) {
      throw new Error(`mfapi failed ${res.status} for ${schemeCode}`);
    }

    const json = await res.json();

    if (json.status !== "SUCCESS") {
      throw new Error(`mfapi returned non-success for ${schemeCode}`);
    }

    return json.data.map((row: any) => ({
      date: parseMfDate(row.date),
      nav: row.nav,
    }));
  }
}

function parseMfDate(s: string): Date {
  const [dd, mm, yyyy] = s.split("-").map(Number);
  return new Date(Date.UTC(yyyy, mm - 1, dd));
}

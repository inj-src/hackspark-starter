import { isCacheOnlyMode } from "./env.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type RateHeaders = {
  limit: number | null;
  remaining: number | null;
  reset: number | null;
};

export class CentralApiClient {
  private tokens = 2;
  private lastRefill = Date.now();
  private readonly refillRatePerMs = 24 / 60_000;
  private readonly burst = 2;

  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  private refill(): void {
    const now = Date.now();
    const delta = now - this.lastRefill;
    this.lastRefill = now;
    this.tokens = Math.min(this.burst, this.tokens + delta * this.refillRatePerMs);
  }

  private async acquireToken(): Promise<number> {
    const start = Date.now();
    while (true) {
      this.refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return Date.now() - start;
      }
      await sleep(200);
    }
  }

  private parseHeaders(res: Response): RateHeaders {
    const limit = Number(res.headers.get("x-ratelimit-limit"));
    const remaining = Number(res.headers.get("x-ratelimit-remaining"));
    const reset = Number(res.headers.get("x-ratelimit-reset"));
    return {
      limit: Number.isFinite(limit) ? limit : null,
      remaining: Number.isFinite(remaining) ? remaining : null,
      reset: Number.isFinite(reset) ? reset : null,
    };
  }

  async getJson<T>(pathWithQuery: string): Promise<{ ok: boolean; status: number; data?: T; error?: string; headers: RateHeaders; waitMs: number }> {
    if (isCacheOnlyMode()) {
      return {
        ok: false,
        status: 503,
        error: "Central API is disabled in RENTAL_CACHE_ONLY mode",
        headers: { limit: null, remaining: null, reset: null },
        waitMs: 0,
      };
    }

    let attempt = 0;
    while (attempt < 5) {
      attempt += 1;
      const waitMs = await this.acquireToken();
      const url = `${this.baseUrl}${pathWithQuery}`;
      const started = Date.now();
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/json",
        },
      });
      const headers = this.parseHeaders(res);

      let body: unknown;
      try {
        body = await res.json();
      } catch {
        body = undefined;
      }

      if (res.status === 429) {
        const retryAfterSeconds = Number((body as { retryAfterSeconds?: number } | undefined)?.retryAfterSeconds ?? 2);
        const jitterMs = Math.floor(Math.random() * 2000);
        const backoffMs = Math.max(1, retryAfterSeconds) * 1000 + jitterMs;
        console.log(`[central-api] ${pathWithQuery} status=429 remaining=${headers.remaining ?? "?"} waitMs=${waitMs} backoffMs=${backoffMs}`);
        await sleep(backoffMs);
        continue;
      }

      if ((headers.remaining ?? 100) <= 3 && headers.reset) {
        const untilResetMs = headers.reset * 1000 - Date.now();
        if (untilResetMs > 0) {
          const adaptiveMs = Math.min(untilResetMs + 200, 5_000);
          console.log(`[central-api] adaptive_pause path=${pathWithQuery} remaining=${headers.remaining} sleepMs=${adaptiveMs}`);
          await sleep(adaptiveMs);
        }
      }

      console.log(`[central-api] ${pathWithQuery} status=${res.status} remaining=${headers.remaining ?? "?"} waitMs=${waitMs} durationMs=${Date.now() - started}`);

      if (!res.ok) {
        return { ok: false, status: res.status, error: JSON.stringify(body), headers, waitMs };
      }
      return { ok: true, status: res.status, data: body as T, headers, waitMs };
    }

    return { ok: false, status: 503, error: "Exceeded retry attempts", headers: { limit: null, remaining: null, reset: null }, waitMs: 0 };
  }
}

import { isCacheOnlyMode } from "./env.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const CACHE_TTL_MS = 5 * 60 * 1000;

type RateHeaders = {
  limit: number | null;
  remaining: number | null;
  reset: number | null;
};

type ClientResult<T> = { ok: boolean; status: number; data?: T; error?: string; headers: RateHeaders; waitMs: number };
type CacheEntry = {
  expiresAt: number;
  status: number;
  data: unknown;
  headers: RateHeaders;
};

export class CentralApiClient {
  private tokens = 2;
  private lastRefill = Date.now();
  private readonly refillRatePerMs = 24 / 60_000;
  private readonly burst = 2;
  private readonly responseCache = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Promise<ClientResult<unknown>>>();

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

  private cleanupExpiredCache(now: number): void {
    for (const [key, entry] of this.responseCache.entries()) {
      if (entry.expiresAt <= now) this.responseCache.delete(key);
    }
  }

  private readCache<T>(key: string): ClientResult<T> | null {
    const now = Date.now();
    this.cleanupExpiredCache(now);
    const hit = this.responseCache.get(key);
    if (!hit) return null;
    return {
      ok: true,
      status: hit.status,
      data: hit.data as T,
      headers: hit.headers,
      waitMs: 0,
    };
  }

  private storeCache<T>(key: string, result: ClientResult<T>): void {
    if (!result.ok || result.data === undefined) return;
    this.responseCache.set(key, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      status: result.status,
      data: result.data,
      headers: result.headers,
    });
  }

  private async fetchJsonWithRateLimit<T>(pathWithQuery: string): Promise<ClientResult<T>> {
    if (isCacheOnlyMode()) {
      return {
        ok: false,
        status: 503,
        error: "Central API is disabled in RENTAL_CACHE_ONLY mode",
        headers: { limit: null, remaining: null, reset: null },
        waitMs: 0,
      };
    }

    for (let attempt = 1; attempt <= 5; attempt += 1) {
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
        console.log(
          `[central-api] ${pathWithQuery} status=429 attempt=${attempt}/5 remaining=${headers.remaining ?? "?"} waitMs=${waitMs} backoffMs=${backoffMs}`,
        );
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

  async getJson<T>(pathWithQuery: string): Promise<ClientResult<T>> {
    const cacheKey = `GET:${pathWithQuery}`;

    const cacheHit = this.readCache<T>(cacheKey);
    if (cacheHit) {
      console.log(`[central-api] cache_hit ${pathWithQuery}`);
      return cacheHit;
    }

    const inFlight = this.inFlight.get(cacheKey);
    if (inFlight) {
      console.log(`[central-api] inflight_join ${pathWithQuery}`);
      return (await inFlight) as ClientResult<T>;
    }

    const task = this.fetchJsonWithRateLimit<T>(pathWithQuery)
      .then((result) => {
        this.storeCache(cacheKey, result);
        return result as ClientResult<unknown>;
      })
      .finally(() => {
        this.inFlight.delete(cacheKey);
      });

    this.inFlight.set(cacheKey, task);
    return (await task) as ClientResult<T>;
  }
}

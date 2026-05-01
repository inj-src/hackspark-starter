type FetchResponse = Pick<Response, "ok" | "status" | "json">;

const memoryCache = new Map<string, { timestamp: number; data: unknown }>();
const inFlightRequests = new Map<string, Promise<unknown>>();
const CACHE_TTL_MS = 60 * 1000;

export async function fetchWithCache(url: string, options: RequestInit = {}): Promise<FetchResponse> {
  const cacheKey = url + (options.headers ? JSON.stringify(options.headers) : "");
  const now = Date.now();
  const cached = memoryCache.get(cacheKey);

  if (cached) {
    if (now - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[Cache Hit] ${url}`);
      return jsonResponse(cached.data);
    }
    memoryCache.delete(cacheKey);
  }

  const pending = inFlightRequests.get(cacheKey);
  if (pending) {
    console.log(`[InFlight Join] ${url}`);
    return jsonResponse(await pending);
  }

  console.log(`[Cache Miss] ${url}`);
  const task = requestWithRetry(url, options).finally(() => {
    inFlightRequests.delete(cacheKey);
  });
  inFlightRequests.set(cacheKey, task);

  try {
    return jsonResponse(await task);
  } catch (err: any) {
    if (err?.message === "UPSTREAM_ERROR" && err.response) return err.response;
    throw err;
  }
}

async function requestWithRetry(url: string, options: RequestInit) {
  let attempt = 0;
  const maxRetries = 3;
  let lastRetryAfter = 72;

  while (attempt <= maxRetries) {
    const resp = await fetch(url, options);

    if (resp.status === 429) {
      if (attempt === maxRetries) {
        throw { message: "429_EXHAUSTED", lastRetryAfter };
      }

      const retryAfterSeconds = await readRetryAfterSeconds(resp);
      lastRetryAfter = retryAfterSeconds;

      let backoff = retryAfterSeconds * Math.pow(2, attempt);
      const jitter = backoff * 0.2;
      backoff = backoff + (Math.random() * 2 * jitter - jitter);

      console.log(
        `[retry ${attempt + 1}/${maxRetries}] waiting ${Math.round(backoff)}s before retrying GET ${url}`,
      );

      await new Promise((resolve) => setTimeout(resolve, backoff * 1000));
      attempt++;
      continue;
    }

    if (resp.ok) {
      const data = await resp.json();
      memoryCache.set(url + (options.headers ? JSON.stringify(options.headers) : ""), {
        timestamp: Date.now(),
        data,
      });
      return data;
    }

    throw { message: "UPSTREAM_ERROR", response: resp };
  }

  throw { message: "UNKNOWN_ERROR" };
}

async function readRetryAfterSeconds(resp: Response) {
  try {
    const body = (await resp.json()) as { retryAfterSeconds?: number };
    return body.retryAfterSeconds || 10;
  } catch (_err) {
    return 10;
  }
}

function jsonResponse(data: unknown): FetchResponse {
  return { ok: true, status: 200, json: async () => data };
}

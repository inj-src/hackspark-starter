import "dotenv/config";
import path from "node:path";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { statusRoute } from "./routes/status.js";
import { analyticsRoute } from "./routes/analytics.js";
import { CacheStore } from "./lib/cache-store.js";
import { setCache } from "./state.js";
import { isCacheOnlyMode } from "./lib/env.js";

const app = new Hono();

app.route("/", statusRoute);
app.route("/", analyticsRoute);

const port = Number(process.env.PORT ?? 8003);
const cacheDir = process.env.ANALYTICS_CACHE_DIR ?? path.join(process.cwd(), "..", "cache");
const cache = new CacheStore(path.resolve(cacheDir));
await cache.init();
setCache(cache);

app.get("/internal/cache/metrics", (c) => {
  return c.json({
    cacheOnly: isCacheOnlyMode(),
    ...cache.getMetrics(),
  });
});

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });
console.log(`[analytics-service] running on :${port}`);

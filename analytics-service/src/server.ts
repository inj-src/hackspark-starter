import "dotenv/config";
import path from "node:path";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { statusRoute } from "./routes/status.js";
import { analyticsRoute } from "./routes/analytics.js";
import { createScraperRuntime } from "./scraper/runner.js";
import { setCache } from "./state.js";
import { isCacheOnlyMode, isTruthy } from "./lib/env.js";

const app = new Hono();

app.route("/", statusRoute);
app.route("/", analyticsRoute);

const port = Number(process.env.PORT ?? 8003);
const cacheDir = process.env.ANALYTICS_CACHE_DIR ?? path.join(process.cwd(), "cache");
const runtime = await createScraperRuntime(cacheDir);
setCache(runtime.cache);

app.get("/internal/cache/metrics", (c) => {
  return c.json({
    cacheOnly: isCacheOnlyMode(),
    scraperDisabled: isTruthy(process.env.DISABLE_SCRAPER),
    ...runtime.cache.getMetrics(),
  });
});

const scraperDisabled = isTruthy(process.env.DISABLE_SCRAPER);
const cacheOnlyMode = isCacheOnlyMode();
if (!scraperDisabled && !cacheOnlyMode) {
  void runtime.startLoop().catch((err) => {
    console.error("[server] scraper loop failed", err);
  });
}

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });
console.log(`[analytics-service] running on :${port}`);

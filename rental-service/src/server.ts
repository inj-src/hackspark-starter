import "dotenv/config";
import path from "node:path";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { statusRoute } from "./routes/status.js";
import { availabilityRoute } from "./routes/availability.js";
import { createScraperRuntime } from "./scraper/runner.js";
import { setCache } from "./state.js";
import { isCacheOnlyMode, isTruthy } from "./lib/env.js";

const app = new Hono();

app.route("/", statusRoute);
app.route("/", availabilityRoute);

const port = Number(process.env.PORT ?? 8002);
const cacheDir = process.env.RENTAL_CACHE_DIR ?? path.join(process.cwd(), "..", "cache");

const setup = {
  runtime: await createScraperRuntime(cacheDir),
};

setCache(setup.runtime.cache);

app.get("/internal/cache/metrics", (c) => {
  return c.json({
    cacheOnly: isCacheOnlyMode(),
    scraperDisabled: isTruthy(process.env.DISABLE_SCRAPER),
    ...setup.runtime.cache.getMetrics(),
  });
});

const scraperDisabled = isTruthy(process.env.DISABLE_SCRAPER);
const cacheOnlyMode = isCacheOnlyMode();
const shouldStartScraper = !scraperDisabled && !cacheOnlyMode;
if (shouldStartScraper) {
  void setup.runtime.startLoop().catch((err) => {
    console.error("[server] scraper loop failed", err);
  });
} else if (cacheOnlyMode) {
  console.log("[server] RENTAL_CACHE_ONLY=true, API will serve cache only");
} else if (scraperDisabled) {
  console.log("[server] scraper disabled by DISABLE_SCRAPER=true");
}

serve({
  fetch: app.fetch,
  port,
  hostname: "0.0.0.0",
});

console.log(`[rental-service] running on :${port}`);

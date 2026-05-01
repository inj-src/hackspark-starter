import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { statusRoute } from "./routes/status.js";
import { analyticsRoute } from "./routes/analytics.js";

const app = new Hono();

app.route("/", statusRoute);
app.route("/", analyticsRoute);

const port = Number(process.env.PORT ?? 8003);

app.get("/internal/cache/metrics", (c) => {
  return c.json({
    cacheOnly: false,
    mode: "live-central-api",
  });
});

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" });
console.log(`[analytics-service] running on :${port}`);

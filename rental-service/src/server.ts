import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { statusRoute } from "./routes/status.js";
import { availabilityRoute } from "./routes/availability.js";
import { productsRoute } from "./routes/products.js";
import { insightsRoute } from "./routes/insights.js";

const app = new Hono();

app.route("/", statusRoute);
app.route("/", availabilityRoute);
app.route("/", productsRoute);
app.route("/", insightsRoute);

const port = Number(process.env.PORT ?? 8002);

app.get("/internal/cache/metrics", (c) => {
  return c.json({
    cacheOnly: false,
    mode: "live-central-api",
  });
});

serve({
  fetch: app.fetch,
  port,
  hostname: "0.0.0.0",
});

console.log(`[rental-service] running on :${port}`);

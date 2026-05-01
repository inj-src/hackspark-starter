import { Hono } from "hono";
import { computeAvailability, validateRange } from "../lib/availability.js";
import { getCache } from "../state.js";

export const availabilityRoute = new Hono();

availabilityRoute.get("/rentals/products/:id/availability", (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: "product id must be a positive integer" }, 400);
  }

  const from = c.req.query("from");
  const to = c.req.query("to");
  if (!from || !to) {
    return c.json({ error: "from and to are required in YYYY-MM-DD format" }, 400);
  }

  const validated = validateRange(from, to);
  if (!validated.ok) {
    return c.json({ error: validated.error }, 400);
  }

  const cache = getCache();
  const rentals = cache.rentalsByProductId.get(id) ?? [];
  const result = computeAvailability(rentals, from, to);

  if ("error" in result) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({
    productId: id,
    from,
    to,
    available: result.available,
    busyPeriods: result.busyPeriods,
    freeWindows: result.freeWindows,
  });
});

import { Hono } from "hono";
import { computeAvailability, validateRange } from "../lib/availability.js";
import { getCentralClient } from "../lib/central.js";
import type { Rental } from "../types.js";

export const availabilityRoute = new Hono();

availabilityRoute.get("/rentals/products/:id/availability", async (c) => {
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

  const rentals: Rental[] = [];
  let page = 1;
  while (true) {
    const res = await getCentralClient().getJson<{ data?: Rental[] }>(
      `/api/data/rentals?product_id=${id}&from=${from}&to=${to}&page=${page}&limit=100`,
    );
    if (!res.ok) {
      return c.json({ error: "central api request failed", message: res.error ?? "unknown" }, res.status as never);
    }
    const rows = Array.isArray(res.data?.data) ? res.data.data : [];
    rentals.push(...rows);
    if (rows.length < 100) break;
    page += 1;
  }

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

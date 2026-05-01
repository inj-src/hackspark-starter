import { Hono } from "hono";
import { getCache } from "../state.js";
import type { Rental } from "../types.js";
import { CentralApiClient } from "../lib/central-client.js";

const DAY_MS = 86_400_000;
const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[0-1])$/;

export const analyticsRoute = new Hono();

function toUtcDate(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysInMonth(year: number, month1to12: number): number {
  return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

function validateMonth(month: string): { ok: true; year: number; month: number } | { ok: false; error: string } {
  if (!monthRegex.test(month)) return { ok: false, error: "month must be valid YYYY-MM" };
  const [yearStr, monthStr] = month.split("-");
  return { ok: true, year: Number(yearStr), month: Number(monthStr) };
}

function validateDate(date: string): { ok: true; date: Date } | { ok: false; error: string } {
  if (!dateRegex.test(date)) return { ok: false, error: "date must be valid YYYY-MM-DD" };
  const d = toUtcDate(date);
  if (Number.isNaN(d.getTime()) || formatDate(d) !== date) return { ok: false, error: "date must be valid YYYY-MM-DD" };
  return { ok: true, date: d };
}

function buildCountMap(rentals: Iterable<Rental>): Map<string, number> {
  const map = new Map<string, number>();
  for (const rental of rentals) {
    const date = rental.rentalStart.slice(0, 10);
    map.set(date, (map.get(date) ?? 0) + 1);
  }
  return map;
}

analyticsRoute.get("/analytics/peak-window", (c) => {
  const from = c.req.query("from");
  const to = c.req.query("to");
  if (!from || !to) return c.json({ error: "from and to are required in YYYY-MM" }, 400);

  const fromCheck = validateMonth(from);
  const toCheck = validateMonth(to);
  if (!fromCheck.ok) return c.json({ error: fromCheck.error }, 400);
  if (!toCheck.ok) return c.json({ error: toCheck.error }, 400);

  const start = toUtcDate(`${from}-01`);
  const end = toUtcDate(`${to}-${String(daysInMonth(toCheck.year, toCheck.month)).padStart(2, "0")}`);
  if (start.getTime() > end.getTime()) return c.json({ error: "from must not be after to" }, 400);

  const monthSpan = (toCheck.year - fromCheck.year) * 12 + (toCheck.month - fromCheck.month) + 1;
  if (monthSpan > 12) return c.json({ error: "max range is 12 months" }, 400);

  const totalDays = Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
  if (totalDays < 7) return c.json({ error: "date range must include at least 7 days" }, 400);

  const counts = buildCountMap(getCache().rentalById.values());
  const days: { date: string; count: number }[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    const d = formatDate(new Date(t));
    days.push({ date: d, count: counts.get(d) ?? 0 });
  }

  let running = 0;
  for (let i = 0; i < 7; i += 1) running += days[i].count;
  let bestSum = running;
  let bestStartIdx = 0;

  for (let i = 7; i < days.length; i += 1) {
    running += days[i].count - days[i - 7].count;
    if (running > bestSum) {
      bestSum = running;
      bestStartIdx = i - 6;
    }
  }

  return c.json({
    from,
    to,
    peakWindow: {
      from: days[bestStartIdx].date,
      to: days[bestStartIdx + 6].date,
      totalRentals: bestSum,
    },
  });
});

analyticsRoute.get("/analytics/surge-days", (c) => {
  const month = c.req.query("month");
  if (!month) return c.json({ error: "month is required in YYYY-MM" }, 400);

  const check = validateMonth(month);
  if (!check.ok) return c.json({ error: check.error }, 400);

  const countsMap = buildCountMap(getCache().rentalById.values());
  const total = daysInMonth(check.year, check.month);
  const days = Array.from({ length: total }, (_, i) => {
    const date = `${month}-${String(i + 1).padStart(2, "0")}`;
    return { date, count: countsMap.get(date) ?? 0 };
  });

  const nextHigher = new Array<number | null>(days.length).fill(null);
  const stack: number[] = [];

  for (let i = 0; i < days.length; i += 1) {
    while (stack.length && days[i].count > days[stack[stack.length - 1]].count) {
      const idx = stack.pop() as number;
      nextHigher[idx] = i;
    }
    stack.push(i);
  }

  return c.json({
    month,
    data: days.map((d, i) => {
      const nextIdx = nextHigher[i];
      return {
        date: d.date,
        count: d.count,
        nextSurgeDate: nextIdx === null ? null : days[nextIdx].date,
        daysUntil: nextIdx === null ? null : nextIdx - i,
      };
    }),
  });
});

analyticsRoute.get("/analytics/recommendations", async (c) => {
  const date = c.req.query("date");
  if (!date) return c.json({ error: "date is required in YYYY-MM-DD" }, 400);

  const dateCheck = validateDate(date);
  if (!dateCheck.ok) return c.json({ error: dateCheck.error }, 400);

  const limitRaw = c.req.query("limit") ?? "10";
  const limit = Number(limitRaw);
  if (!Number.isInteger(limit) || limit <= 0 || limit > 50) {
    return c.json({ error: "limit must be a positive integer and at most 50" }, 400);
  }

  const base = dateCheck.date;
  const baseYear = base.getUTCFullYear();
  const cache = getCache();
  const scores = new Map<number, number>();

  const windows = [baseYear - 1, baseYear - 2].map((y) => {
    const anchor = new Date(Date.UTC(y, base.getUTCMonth(), base.getUTCDate()));
    const start = new Date(anchor.getTime() - 7 * DAY_MS);
    const end = new Date(anchor.getTime() + 7 * DAY_MS);
    return { start, end };
  });

  for (const rental of cache.rentalById.values()) {
    const startDate = new Date(rental.rentalStart);
    const inWindow = windows.some((w) => startDate.getTime() >= w.start.getTime() && startDate.getTime() <= w.end.getTime());
    if (!inWindow) continue;
    scores.set(rental.productId, (scores.get(rental.productId) ?? 0) + 1);
  }

  const rawRecommendations = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, limit)
    .map(([productId, score]) => ({ productId, score }));

  const missingIds = rawRecommendations
    .filter((r) => !cache.productById.has(r.productId))
    .map((r) => r.productId);

  if (missingIds.length > 0) {
    const client = new CentralApiClient(
      process.env.CENTRAL_API_URL || "https://technocracy.brittoo.xyz",
      process.env.CENTRAL_API_TOKEN || ""
    );
    const res = await client.getJson<any>(`/api/data/products/batch?ids=${missingIds.join(",")}`);
    const products = Array.isArray(res.data) ? res.data : res.data?.data;
    if (res.ok && Array.isArray(products)) {
      for (const p of products) {
        cache.productById.set(p.id, p);
      }
    }
  }

  const recommendations = rawRecommendations.map((r) => {
    const p = cache.productById.get(r.productId);
    return {
      productId: r.productId,
      name: p?.name ?? `Product #${r.productId}`,
      category: p?.category ?? "UNKNOWN",
      score: r.score,
    };
  });

  return c.json({ date, recommendations });
});

analyticsRoute.get("/analytics/search", (c) => {
  const q = c.req.query("q")?.toLowerCase();
  if (!q) return c.json({ error: "query q is required" }, 400);

  const results = Array.from(getCache().productById.values())
    .filter((p) => 
      p.name.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q)
    )
    .slice(0, 10);

  return c.json({ query: q, results });
});


import { Hono } from "hono";
import { MinHeap } from "../lib/min-heap.js";
import { getCentralClient } from "../lib/central.js";
import { addDays, daysBetweenInclusive, daysInMonth, parseMonth, toUtcDate, toYmd } from "../lib/date.js";
import type { Product, Rental } from "../types.js";

type Interval = { start: Date; end: Date };
type Ranked = { key: string; count: number };
type FeedNode = { rentalId: number; productId: number; rentalStart: string; rentalEnd: string; stream: number; idx: number };

export const insightsRoute = new Hono();

async function fetchRentals(query: string): Promise<{ ok: true; data: Rental[] } | { ok: false; status: number; error: string }> {
  const data: Rental[] = [];
  let page = 1;
  while (true) {
    const res = await getCentralClient().getJson<{ data?: Rental[] }>(`/api/data/rentals?${query}&page=${page}&limit=100`);
    if (!res.ok) return { ok: false, status: res.status, error: res.error ?? "unknown" };
    const rows = Array.isArray(res.data?.data) ? res.data.data : [];
    data.push(...rows);
    if (rows.length < 100) break;
    page += 1;
  }
  return { ok: true, data };
}

async function fetchProductsByIds(ids: number[]): Promise<Map<number, Product>> {
  const byId = new Map<number, Product>();
  if (ids.length === 0) return byId;
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const res = await getCentralClient().getJson<{ data?: Product[] }>(`/api/data/products/batch?ids=${chunk.join(",")}`);
    if (!res.ok) continue;
    const rows = Array.isArray(res.data?.data) ? res.data.data : [];
    for (const p of rows) byId.set(p.id, p);
  }
  return byId;
}

function cmpWorse(a: Ranked, b: Ranked): number {
  if (a.count !== b.count) return a.count - b.count;
  return b.key.localeCompare(a.key);
}

function cmpFeed(a: FeedNode, b: FeedNode): number {
  if (a.rentalStart !== b.rentalStart) return a.rentalStart.localeCompare(b.rentalStart);
  if (a.productId !== b.productId) return a.productId - b.productId;
  return a.rentalId - b.rentalId;
}

function mergeIntervals(items: Interval[]): Interval[] {
  const sorted = [...items].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: Interval[] = [];
  for (const current of sorted) {
    const last = merged[merged.length - 1];
    if (!last) {
      merged.push(current);
      continue;
    }
    if (current.start.getTime() <= addDays(last.end, 1).getTime()) {
      if (current.end > last.end) last.end = current.end;
      continue;
    }
    merged.push(current);
  }
  return merged;
}

insightsRoute.get("/rentals/kth-busiest-date", async (c) => {
  const from = c.req.query("from");
  const to = c.req.query("to");
  const kRaw = c.req.query("k");
  if (!from || !to || !kRaw) return c.json({ error: "from,to,k are required" }, 400);
  const fromM = parseMonth(from);
  const toM = parseMonth(to);
  if (!fromM.ok) return c.json({ error: fromM.error }, 400);
  if (!toM.ok) return c.json({ error: toM.error }, 400);
  const k = Number(kRaw);
  if (!Number.isInteger(k) || k <= 0) return c.json({ error: "k must be a positive integer" }, 400);
  const monthSpan = (toM.year - fromM.year) * 12 + (toM.month - fromM.month) + 1;
  if (monthSpan <= 0) return c.json({ error: "from must not be after to" }, 400);
  if (monthSpan > 12) return c.json({ error: "max range is 12 months" }, 400);

  const start = toUtcDate(`${from}-01`);
  const end = toUtcDate(`${to}-${String(daysInMonth(toM.year, toM.month)).padStart(2, "0")}`);
  const rentalsRes = await fetchRentals(`from=${toYmd(start)}&to=${toYmd(end)}`);
  if (!rentalsRes.ok) return c.json({ error: "central api request failed", message: rentalsRes.error }, rentalsRes.status as never);

  const counts = new Map<string, number>();
  for (const rental of rentalsRes.data) {
    const key = rental.rentalStart.slice(0, 10);
    const d = toUtcDate(key);
    if (d < start || d > end) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (counts.size < k) return c.json({ error: "k exceeds number of distinct dates in range" }, 404);

  const heap = new MinHeap<Ranked>(cmpWorse);
  for (const [key, count] of counts.entries()) {
    if (heap.size() < k) {
      heap.push({ key, count });
      continue;
    }
    const root = heap.peek() as Ranked;
    if (cmpWorse(root, { key, count }) < 0) {
      heap.pop();
      heap.push({ key, count });
    }
  }
  const kth = heap.peek() as Ranked;
  return c.json({ from, to, k, date: kth.key, rentalCount: kth.count });
});

insightsRoute.get("/rentals/users/:id/top-categories", async (c) => {
  const userId = Number(c.req.param("id"));
  if (!Number.isInteger(userId) || userId <= 0) return c.json({ error: "user id must be a positive integer" }, 400);
  const kRaw = c.req.query("k") ?? "5";
  const k = Number(kRaw);
  if (!Number.isInteger(k) || k <= 0) return c.json({ error: "k must be a positive integer" }, 400);

  const rentalsRes = await fetchRentals(`renter_id=${userId}`);
  if (!rentalsRes.ok) return c.json({ error: "central api request failed", message: rentalsRes.error }, rentalsRes.status as never);
  const products = await fetchProductsByIds(Array.from(new Set(rentalsRes.data.map((x) => x.productId))));

  const counts = new Map<string, number>();
  for (const rental of rentalsRes.data) {
    const category = products.get(rental.productId)?.category;
    if (!category) continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  const heap = new MinHeap<Ranked>(cmpWorse);
  for (const [key, count] of counts.entries()) {
    if (heap.size() < k) {
      heap.push({ key, count });
      continue;
    }
    const root = heap.peek() as Ranked;
    if (cmpWorse(root, { key, count }) < 0) {
      heap.pop();
      heap.push({ key, count });
    }
  }

  const top = heap
    .toArray()
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .map((x) => ({ category: x.key, rentalCount: x.count }));
  return c.json({ userId, topCategories: top });
});

insightsRoute.get("/rentals/products/:id/free-streak", async (c) => {
  const productId = Number(c.req.param("id"));
  const yearRaw = c.req.query("year");
  if (!Number.isInteger(productId) || productId <= 0) return c.json({ error: "product id must be a positive integer" }, 400);
  const year = Number(yearRaw);
  if (!Number.isInteger(year) || year < 1970 || year > 2100) return c.json({ error: "year must be a valid integer" }, 400);

  const yearStart = toUtcDate(`${year}-01-01`);
  const yearEnd = toUtcDate(`${year}-12-31`);
  const rentalsRes = await fetchRentals(`product_id=${productId}&from=${year}-01-01&to=${year}-12-31`);
  if (!rentalsRes.ok) return c.json({ error: "central api request failed", message: rentalsRes.error }, rentalsRes.status as never);
  const intervals: Interval[] = [];
  for (const rental of rentalsRes.data) {
    const s = new Date(rental.rentalStart);
    const e = new Date(rental.rentalEnd);
    const start = s < yearStart ? yearStart : new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
    const end = e > yearEnd ? yearEnd : new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate()));
    if (end < yearStart || start > yearEnd || start > end) continue;
    intervals.push({ start, end });
  }
  const merged = mergeIntervals(intervals);
  if (merged.length === 0) {
    return c.json({ productId, year, longestFreeStreak: { from: `${year}-01-01`, to: `${year}-12-31`, days: daysBetweenInclusive(yearStart, yearEnd) } });
  }

  let bestStart = yearStart;
  let bestEnd = addDays(merged[0].start, -1);
  if (bestEnd < bestStart) bestEnd = bestStart;
  let cursor = yearStart;
  for (const busy of merged) {
    if (cursor < busy.start) {
      const gapStart = cursor;
      const gapEnd = addDays(busy.start, -1);
      if (daysBetweenInclusive(gapStart, gapEnd) > daysBetweenInclusive(bestStart, bestEnd)) {
        bestStart = gapStart;
        bestEnd = gapEnd;
      }
    }
    const next = addDays(busy.end, 1);
    if (next > cursor) cursor = next;
  }
  if (cursor <= yearEnd && daysBetweenInclusive(cursor, yearEnd) > daysBetweenInclusive(bestStart, bestEnd)) {
    bestStart = cursor;
    bestEnd = yearEnd;
  }
  return c.json({ productId, year, longestFreeStreak: { from: toYmd(bestStart), to: toYmd(bestEnd), days: daysBetweenInclusive(bestStart, bestEnd) } });
});

insightsRoute.get("/rentals/merged-feed", async (c) => {
  const idsRaw = c.req.query("productIds");
  if (!idsRaw) return c.json({ error: "productIds is required" }, 400);
  const parsed = idsRaw.split(",").map((x) => Number(x.trim())).filter((x) => Number.isInteger(x) && x > 0);
  const dedup = Array.from(new Set(parsed));
  if (dedup.length < 1 || dedup.length > 10) return c.json({ error: "productIds must contain 1-10 positive integers" }, 400);

  const limitRaw = c.req.query("limit") ?? "30";
  const limit = Number(limitRaw);
  if (!Number.isInteger(limit) || limit <= 0) return c.json({ error: "limit must be a positive integer" }, 400);

  const streams: Array<Array<{ rentalId: number; productId: number; rentalStart: string; rentalEnd: string }>> = [];
  for (const id of dedup) {
    const rentalsRes = await fetchRentals(`product_id=${id}`);
    if (!rentalsRes.ok) return c.json({ error: "central api request failed", message: rentalsRes.error }, rentalsRes.status as never);
    streams.push(
      rentalsRes.data.map((r) => ({
        rentalId: r.id,
        productId: r.productId,
        rentalStart: r.rentalStart.slice(0, 10),
        rentalEnd: r.rentalEnd.slice(0, 10),
      })),
    );
  }

  const heap = new MinHeap<FeedNode>(cmpFeed);
  streams.forEach((rows, stream) => {
    if (rows.length === 0) return;
    heap.push({ ...rows[0], stream, idx: 0 });
  });

  const feed: Array<{ rentalId: number; productId: number; rentalStart: string; rentalEnd: string }> = [];
  while (heap.size() > 0 && feed.length < limit) {
    const node = heap.pop() as FeedNode;
    feed.push({ rentalId: node.rentalId, productId: node.productId, rentalStart: node.rentalStart, rentalEnd: node.rentalEnd });
    const nextIdx = node.idx + 1;
    const row = streams[node.stream][nextIdx];
    if (row) heap.push({ ...row, stream: node.stream, idx: nextIdx });
  }
  return c.json({ productIds: dedup, limit, feed });
});

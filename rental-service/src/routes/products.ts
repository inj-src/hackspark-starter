import { Context, Hono } from "hono";
import { getCache } from "../state.js";
import { getCentralClient, getValidCategories } from "../lib/central.js";
import { isCacheOnlyMode } from "../lib/env.js";

type ProductsEnvelope = {
  data: unknown[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export const productsRoute = new Hono();

function toPositiveInt(v: string | undefined, fallback: number): number {
  if (!v) return fallback;
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) return fallback;
  return n;
}

async function listProducts(c: Context) {
  const category = c.req.query("category");
  if (category) {
    try {
      const valid = isCacheOnlyMode()
        ? Array.from(new Set(Array.from(getCache().productById.values()).map((p) => p.category))).sort()
        : (await getValidCategories()).sort();
      if (!valid.includes(category)) {
        return c.json({ error: `invalid category '${category}'`, validCategories: valid }, 400);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "failed to validate category";
      return c.json({ error: message }, 502);
    }
  }

  if (isCacheOnlyMode()) {
    const page = toPositiveInt(c.req.query("page"), 1);
    const limit = toPositiveInt(c.req.query("limit"), 50);
    const ownerId = c.req.query("owner_id");
    const ownerIdNum = ownerId ? Number(ownerId) : null;

    let rows = Array.from(getCache().productById.values());
    if (category) rows = rows.filter((p) => p.category === category);
    if (ownerIdNum && Number.isInteger(ownerIdNum)) rows = rows.filter((p) => p.ownerId === ownerIdNum);
    rows.sort((a, b) => a.id - b.id);

    const total = rows.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const start = (page - 1) * limit;
    return c.json({ data: rows.slice(start, start + limit), page, limit, total, totalPages });
  }

  const incoming = new URL(c.req.url);
  const result = await getCentralClient().getJson<ProductsEnvelope>(`/api/data/products${incoming.search}`);
  if (!result.ok) {
    return c.json(
      {
        error: "central api request failed",
        message: result.error ?? "unknown",
      },
      result.status as never,
    );
  }
  return c.json(result.data as ProductsEnvelope, result.status as never);
}

productsRoute.get("/rentals/products", listProducts);
productsRoute.get("/rent", listProducts);

productsRoute.get("/rent/categories", async (c) => {
  try {
    const valid = isCacheOnlyMode()
      ? Array.from(new Set(Array.from(getCache().productById.values()).map((p) => p.category))).sort()
      : (await getValidCategories()).sort();
    return c.json({ categories: valid });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to fetch categories";
    return c.json({ error: message }, 502);
  }
});

productsRoute.get("/rentals/products/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) return c.json({ error: "product id must be a positive integer" }, 400);

  if (isCacheOnlyMode()) {
    const product = getCache().productById.get(id);
    if (!product) return c.json({ error: "product not found" }, 404);
    return c.json(product);
  }

  const result = await getCentralClient().getJson<unknown>(`/api/data/products/${id}`);
  if (!result.ok) {
    return c.json(
      {
        error: "central api request failed",
        message: result.error ?? "unknown",
      },
      result.status as never,
    );
  }
  return c.json(result.data, result.status as never);
});

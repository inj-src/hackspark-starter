import { Context, Hono } from "hono";
import { getCentralClient, getValidCategories } from "../lib/central.js";

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
      const valid = (await getValidCategories()).sort();
      if (!valid.includes(category)) {
        return c.json({ error: `invalid category '${category}'`, validCategories: valid }, 400);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "failed to validate category";
      return c.json({ error: message }, 502);
    }
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
    const valid = (await getValidCategories()).sort();
    return c.json({ categories: valid });
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to fetch categories";
    return c.json({ error: message }, 502);
  }
});

productsRoute.get("/rentals/products/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) return c.json({ error: "product id must be a positive integer" }, 400);

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

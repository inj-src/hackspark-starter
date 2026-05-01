import { CentralApiClient } from "./central-client.js";

let client: CentralApiClient | null = null;
let categoriesCache: { expiresAt: number; values: string[] } | null = null;

const CATEGORY_TTL_MS = 15 * 60 * 1000;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`${name} is required`);
  return v.trim();
}

export function getCentralClient(): CentralApiClient {
  if (!client) {
    client = new CentralApiClient(requireEnv("CENTRAL_API_URL"), requireEnv("CENTRAL_API_TOKEN"));
  }
  return client;
}

export async function getValidCategories(): Promise<string[]> {
  const now = Date.now();
  if (categoriesCache && categoriesCache.expiresAt > now) return categoriesCache.values;

  const result = await getCentralClient().getJson<{ categories?: string[] }>("/api/data/categories");
  if (!result.ok) {
    throw new Error(`Failed to fetch categories: status=${result.status} error=${result.error ?? "unknown"}`);
  }
  const categories = Array.isArray(result.data?.categories) ? result.data?.categories : [];
  const values = categories.map((c) => String(c));
  categoriesCache = { expiresAt: now + CATEGORY_TTL_MS, values };
  return values;
}

import path from "node:path";
import { CacheStore } from "../lib/cache-store.js";
import { CentralApiClient } from "../lib/central-client.js";
import { fetchProductsPage, fetchRentalsPage } from "./tasks.js";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type ScraperRuntime = {
  startLoop: () => Promise<void>;
  runOnce: () => Promise<void>;
  cache: CacheStore;
};

export async function createScraperRuntime(cacheDir: string): Promise<ScraperRuntime> {
  const cache = new CacheStore(path.resolve(cacheDir));
  await cache.init();

  function getClient(): CentralApiClient {
    const baseUrl = process.env.CENTRAL_API_URL;
    const token = process.env.CENTRAL_API_TOKEN;
    if (!baseUrl || !token) {
      throw new Error("CENTRAL_API_URL and CENTRAL_API_TOKEN are required to run scraper");
    }
    return new CentralApiClient(baseUrl, token);
  }

  async function ingestOneProductsPage(client: CentralApiClient): Promise<void> {
    const page = cache.meta.cursor.products.page;
    const result = await fetchProductsPage(client, page);
    if (!result.ok) return;
    const rows = result.data?.data ?? [];
    await cache.upsertProducts(rows);
    cache.meta.cursor.products.page = rows.length === 0 ? 1 : page + 1;
    cache.meta.lastRunAt = new Date().toISOString();
  }

  async function ingestOneRentalsPage(client: CentralApiClient): Promise<void> {
    const page = cache.meta.cursor.rentals.page;
    const result = await fetchRentalsPage(client, page);
    if (!result.ok) return;
    const rows = result.data?.data ?? [];
    await cache.upsertRentals(rows);
    cache.meta.cursor.rentals.page = rows.length === 0 ? 1 : page + 1;
    cache.meta.lastRunAt = new Date().toISOString();
  }

  async function runOnce(): Promise<void> {
    const client = getClient();
    await ingestOneProductsPage(client);
    await ingestOneRentalsPage(client);
    await cache.writeMeta();
  }

  async function startLoop(): Promise<void> {
    const client = getClient();
    while (true) {
      await ingestOneProductsPage(client);
      await sleep(250);
      await ingestOneRentalsPage(client);
      await cache.writeMeta();
      await sleep(250);
    }
  }

  return { startLoop, runOnce, cache };
}

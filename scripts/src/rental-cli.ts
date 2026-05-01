import "dotenv/config";
import { CacheStore } from "../../rental-service/src/lib/cache-store.js";
import { CentralApiClient } from "../../rental-service/src/lib/central-client.js";
import type { Product, Rental } from "../../rental-service/src/types.js";
import { requireCentralConfig, resolveRepoCacheDir, sleep, type ScraperMode } from "./shared.js";

async function fetchProductsPage(client: CentralApiClient, page: number) {
  return client.getJson<{ data: Product[]; page: number; limit: number; total: number; totalPages: number }>(`/api/data/products?page=${page}&limit=100`);
}

async function fetchRentalsPage(client: CentralApiClient, page: number) {
  return client.getJson<{ data: Rental[]; page: number; limit: number; total: number }>(`/api/data/rentals?page=${page}&limit=100`);
}

async function main(mode: ScraperMode): Promise<void> {
  const cache = new CacheStore(resolveRepoCacheDir("RENTAL_CACHE_DIR"));
  await cache.init();

  const { baseUrl, token } = requireCentralConfig();
  const client = new CentralApiClient(baseUrl, token);

  let checkpointCounter = 0;

  const ingestProducts = async () => {
    const page = cache.meta.cursor.products.page;
    const result = await fetchProductsPage(client, page);
    if (!result.ok) return;
    const rows = result.data?.data ?? [];
    await cache.upsertProducts(rows);
    cache.meta.cursor.products.page = rows.length === 0 ? 1 : page + 1;
    cache.meta.lastRunAt = new Date().toISOString();
    checkpointCounter += 1;
  };

  const ingestRentals = async () => {
    const page = cache.meta.cursor.rentals.page;
    const result = await fetchRentalsPage(client, page);
    if (!result.ok) return;
    const rows = result.data?.data ?? [];
    await cache.upsertRentals(rows);
    cache.meta.cursor.rentals.page = rows.length === 0 ? 1 : page + 1;
    cache.meta.lastRunAt = new Date().toISOString();
    checkpointCounter += 1;
  };

  const maybeCheckpoint = async () => {
    if (checkpointCounter >= 5) {
      await cache.writeMeta();
      checkpointCounter = 0;
    }
  };

  if (mode === "once") {
    await ingestProducts();
    await ingestRentals();
    await cache.writeMeta();
    console.log("[scraper] finished one pass");
    return;
  }

  process.on("SIGINT", async () => {
    await cache.writeMeta();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await cache.writeMeta();
    process.exit(0);
  });

  console.log("[scraper] starting continuous loop");
  while (true) {
    await ingestProducts();
    await maybeCheckpoint();
    await sleep(250);
    await ingestRentals();
    await maybeCheckpoint();
    await sleep(250);
  }
}

const mode = (process.argv[2] as ScraperMode | undefined) ?? "loop";
main(mode).catch((err) => {
  console.error("[scraper] fatal", err);
  process.exit(1);
});

import { mkdir, readFile, rename, writeFile, appendFile, access } from "node:fs/promises";
import path from "node:path";
import type { CacheMeta, Product, Rental } from "../types.js";

const DEFAULT_META: CacheMeta = {
  lastRunAt: null,
  cursor: {
    products: { page: 1 },
    rentals: { page: 1 },
  },
  stats: {
    totalProductsCached: 0,
    totalRentalsCached: 0,
  },
  rate: {
    windowStart: new Date(0).toISOString(),
    requestCountInWindow: 0,
  },
};

export class CacheStore {
  private readonly dir: string;
  private readonly metaPath: string;
  private readonly productsPath: string;
  private readonly rentalsPath: string;

  public readonly productById = new Map<number, Product>();
  public readonly rentalById = new Map<number, Rental>();
  public readonly rentalsByProductId = new Map<number, Rental[]>();
  public meta: CacheMeta = structuredClone(DEFAULT_META);

  constructor(cacheDir: string) {
    this.dir = cacheDir;
    this.metaPath = path.join(cacheDir, "meta.json");
    this.productsPath = path.join(cacheDir, "products.ndjson");
    this.rentalsPath = path.join(cacheDir, "rentals.ndjson");
  }

  async init(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    await this.ensureFile(this.metaPath, JSON.stringify(DEFAULT_META, null, 2) + "\n");
    await this.ensureFile(this.productsPath, "");
    await this.ensureFile(this.rentalsPath, "");

    const metaRaw = await readFile(this.metaPath, "utf8");
    this.meta = { ...structuredClone(DEFAULT_META), ...JSON.parse(metaRaw) };

    await this.loadNdjson<Product>(this.productsPath, (p) => {
      this.productById.set(p.id, p);
    });

    await this.loadNdjson<Rental>(this.rentalsPath, (r) => {
      this.rentalById.set(r.id, r);
    });

    this.rebuildRentalIndex();
    this.meta.stats.totalProductsCached = this.productById.size;
    this.meta.stats.totalRentalsCached = this.rentalById.size;
    await this.writeMeta();
  }

  private async ensureFile(filePath: string, defaultContent: string): Promise<void> {
    try {
      await access(filePath);
    } catch {
      await writeFile(filePath, defaultContent, "utf8");
    }
  }

  private async loadNdjson<T>(filePath: string, onRow: (v: T) => void): Promise<void> {
    const raw = await readFile(filePath, "utf8");
    if (!raw.trim()) return;
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line) as T;
        onRow(obj);
      } catch {
        // ignore malformed line
      }
    }
  }

  private rebuildRentalIndex(): void {
    this.rentalsByProductId.clear();
    for (const rental of this.rentalById.values()) {
      const arr = this.rentalsByProductId.get(rental.productId) ?? [];
      arr.push(rental);
      this.rentalsByProductId.set(rental.productId, arr);
    }
    for (const arr of this.rentalsByProductId.values()) {
      arr.sort((a, b) => new Date(a.rentalStart).getTime() - new Date(b.rentalStart).getTime());
    }
  }

  async upsertProducts(products: Product[]): Promise<void> {
    if (!products.length) return;
    for (const p of products) {
      this.productById.set(p.id, p);
      await appendFile(this.productsPath, JSON.stringify(p) + "\n", "utf8");
    }
    this.meta.stats.totalProductsCached = this.productById.size;
  }

  async upsertRentals(rentals: Rental[]): Promise<void> {
    if (!rentals.length) return;
    for (const r of rentals) {
      this.rentalById.set(r.id, r);
      await appendFile(this.rentalsPath, JSON.stringify(r) + "\n", "utf8");
    }
    this.rebuildRentalIndex();
    this.meta.stats.totalRentalsCached = this.rentalById.size;
  }

  async writeMeta(): Promise<void> {
    const tmp = `${this.metaPath}.tmp`;
    await writeFile(tmp, JSON.stringify(this.meta, null, 2) + "\n", "utf8");
    await rename(tmp, this.metaPath);
  }

  getMetrics() {
    return {
      stats: this.meta.stats,
      cursor: this.meta.cursor,
      lastRunAt: this.meta.lastRunAt,
      indexedProducts: this.productById.size,
      indexedRentals: this.rentalById.size,
      indexedProductsWithRentals: this.rentalsByProductId.size,
    };
  }
}

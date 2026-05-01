import type { CacheStore } from "./lib/cache-store.js";

let cache: CacheStore | null = null;

export function setCache(next: CacheStore): void {
  cache = next;
}

export function getCache(): CacheStore {
  if (!cache) {
    throw new Error("Cache has not been initialized");
  }
  return cache;
}

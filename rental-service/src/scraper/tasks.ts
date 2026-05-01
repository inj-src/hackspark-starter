import type { Product, Rental } from "../types.js";
import { CentralApiClient } from "../lib/central-client.js";

export async function fetchProductsPage(client: CentralApiClient, page: number) {
  return client.getJson<{ data: Product[]; page: number; limit: number; total: number; totalPages: number }>(`/api/data/products?page=${page}&limit=100`);
}

export async function fetchRentalsPage(client: CentralApiClient, page: number) {
  return client.getJson<{ data: Rental[]; page: number; limit: number; total: number }>(`/api/data/rentals?page=${page}&limit=100`);
}

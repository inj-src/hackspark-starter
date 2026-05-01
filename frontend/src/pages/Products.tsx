import React, { useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

type ApiProduct = {
  id: number;
  name: string;
  category: string;
  pricePerDay: number;
  ownerId: number;
};

type ProductsEnvelope = {
  data: ApiProduct[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ErrorResponse = {
  error?: string;
  message?: string;
  validCategories?: string[];
};
type AvailabilityResponse = {
  productId: number;
  from: string;
  to: string;
  available: boolean;
  freeWindows: Array<{ start: string; end: string }>;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let payload: ErrorResponse | null;
    try {
      payload = (await res.json()) as ErrorResponse;
    } catch {
      payload = null;
    }
    const msg = payload?.message || payload?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

const Products: React.FC = () => {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category') ?? '';
  const searchTextFromUrl = searchParams.get('search') ?? '';
  const [category, setCategory] = useState<string>(categoryFromUrl);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchText, setSearchText] = useState(searchTextFromUrl);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const productsQuery = useQuery({
    queryKey: ['rent-products', category, page, limit],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (category) params.set('category', category);
      return fetchJson<ProductsEnvelope>(`${API_BASE_URL}/rentals/products?${params.toString()}`);
    },
    placeholderData: (prev) => prev,
  });
  const productDetailsQuery = useQuery({
    queryKey: ['product-details', selectedProductId],
    queryFn: () => fetchJson<ApiProduct>(`${API_BASE_URL}/rentals/products/${selectedProductId}`),
    enabled: selectedProductId !== null,
  });

  const products = useMemo(() => productsQuery.data?.data ?? [], [productsQuery.data]);
  const totalPages = productsQuery.data?.totalPages ?? 0;
  const filteredProducts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => {
      const haystack = `${product.name} ${product.category}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [products, searchText]);
  const categoryOptions = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category))).sort();
  }, [products]);
  const canCheckAvailability = Boolean(fromDate && toDate);
  const availabilityQueries = useQueries({
    queries: filteredProducts.map((product) => ({
      queryKey: ['availability', product.id, fromDate, toDate],
      queryFn: () =>
        fetchJson<AvailabilityResponse>(
          `${API_BASE_URL}/rentals/products/${product.id}/availability?from=${fromDate}&to=${toDate}`,
        ),
      enabled: canCheckAvailability,
      staleTime: 60_000,
    })),
  });
  const availabilityByProductId = useMemo(() => {
    const map = new Map<number, AvailabilityResponse>();
    filteredProducts.forEach((product, index) => {
      const data = availabilityQueries[index]?.data;
      if (data) map.set(product.id, data);
    });
    return map;
  }, [availabilityQueries, filteredProducts]);

  const pageLabel = useMemo(() => {
    if (!productsQuery.data) return 'No data yet';
    if (totalPages === 0) return 'No matching products';
    return `Page ${productsQuery.data.page} of ${totalPages}`;
  }, [productsQuery.data, totalPages]);

  return (
    <PageTransition>
      <section className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Rent Products</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2">Browse products with category filters and pagination.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Text Search</label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                }}
                placeholder="Search by name or category"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
              >
                <option value="">All categories</option>
                {category && !categoryOptions.includes(category) && <option value={category}>{category}</option>}
                {categoryOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setCategory('');
                  setSearchText('');
                  setFromDate('');
                  setToDate('');
                  setPage(1);
                }}
                className="w-auto rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-2 text-sm font-medium"
              >
                Reset Filters
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {productsQuery.isError && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 text-red-800 px-4 py-3">
              {String(productsQuery.error?.message ?? 'Failed to load data')}
            </div>
          )}

          <div className="mb-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
            <span>{pageLabel}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedProductId(product.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{product.name}</h2>
                  <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                    {product.category}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Owner #{product.ownerId}</p>
                <p className="mt-1 text-base font-semibold text-emerald-700 dark:text-emerald-400">৳{product.pricePerDay.toFixed(2)} / day</p>
                {canCheckAvailability && (
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                    {availabilityByProductId.get(product.id)?.available
                      ? `Available (${fromDate} to ${toDate})`
                      : `Not available (${fromDate} to ${toDate})`}
                  </p>
                )}
              </article>
            ))}
          </div>

          {!productsQuery.isLoading && filteredProducts.length === 0 && (
            <div className="mt-8 text-center text-slate-500 dark:text-slate-400">No products found for current filters.</div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              disabled={page <= 1 || productsQuery.isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-700 dark:text-slate-200">{pageLabel}</span>
            <button
              disabled={productsQuery.isLoading || totalPages === 0 || page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {selectedProductId !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => setSelectedProductId(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Product Details</h3>
              <button
                onClick={() => setSelectedProductId(null)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            {productDetailsQuery.isLoading && (
              <p className="mt-4 text-slate-600 dark:text-slate-300">Loading details...</p>
            )}
            {productDetailsQuery.isError && (
              <p className="mt-4 text-red-700">Failed to load product details.</p>
            )}
            {productDetailsQuery.data && (
              <div className="mt-5 space-y-2 text-slate-800 dark:text-slate-100">
                <p><strong>ID:</strong> {productDetailsQuery.data.id}</p>
                <p><strong>Name:</strong> {productDetailsQuery.data.name}</p>
                <p><strong>Category:</strong> {productDetailsQuery.data.category}</p>
                <p><strong>Owner ID:</strong> {productDetailsQuery.data.ownerId}</p>
                <p><strong>Price Per Day:</strong> ৳{productDetailsQuery.data.pricePerDay.toFixed(2)}</p>
                {canCheckAvailability && (
                  <p>
                    <strong>Availability:</strong>{' '}
                    {availabilityByProductId.get(productDetailsQuery.data.id)?.available
                      ? `Available (${fromDate} to ${toDate})`
                      : `Not available (${fromDate} to ${toDate})`}
                  </p>
                )}
              </div>
            )}

            <button className="mt-6 w-full rounded-xl bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold">
              Rent Now
            </button>
          </div>
        </div>
      )}
    </PageTransition>
  );
};

export default Products;

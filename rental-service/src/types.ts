export type Product = {
  id: number;
  name: string;
  category: string;
  pricePerDay: number;
  ownerId: number;
};

export type Rental = {
  id: number;
  productId: number;
  ownerId: number;
  renterId: number;
  rentalStart: string;
  rentalEnd: string;
  discountPercent: number;
};

export type CacheMeta = {
  lastRunAt: string | null;
  cursor: {
    products: { page: number };
    rentals: { page: number };
  };
  stats: {
    totalProductsCached: number;
    totalRentalsCached: number;
  };
  rate: {
    windowStart: string;
    requestCountInWindow: number;
  };
};

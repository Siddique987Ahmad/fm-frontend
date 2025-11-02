// Utility functions for product types

export interface ProductType {
  id: string;
  name: string;
  value: string;
  allowedTransactions?: ('sale' | 'purchase')[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

// Cache for product types to avoid repeated API calls
let productTypesCache: ProductType[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const fetchProductTypes = async (): Promise<ProductType[]> => {
  // Check if cache is still valid
  const now = Date.now();
  if (productTypesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return productTypesCache;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/products/types`);
    const data = await response.json();

    if (data.success && data.data) {
      productTypesCache = data.data;
      cacheTimestamp = now;
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch product types');
    }
  } catch (error) {
    console.error('Error fetching product types:', error);
    // Return fallback product types if API fails
    return [
      { id: 'white-oil', name: 'White Oil', value: 'white-oil' },
      { id: 'yellow-oil', name: 'Yellow Oil', value: 'yellow-oil' },
      { id: 'crude-oil', name: 'Crude Oil', value: 'crude-oil' },
      { id: 'diesel', name: 'Diesel', value: 'diesel' },
      { id: 'petrol', name: 'Petrol', value: 'petrol' },
      { id: 'kerosene', name: 'Kerosene', value: 'kerosene' },
      { id: 'lpg', name: 'LPG', value: 'lpg' },
      { id: 'natural-gas', name: 'Natural Gas', value: 'natural-gas' }
    ];
  }
};

// Clear cache when needed (e.g., after admin adds new products)
export const clearProductTypesCache = () => {
  productTypesCache = null;
  cacheTimestamp = 0;
};


// Utility functions for product types
import { getApiUrl, fetchJson } from './apiClient';

export interface ProductType {
  id: string;
  name: string;
  value: string;
  allowedTransactions?: ('sale' | 'purchase')[];
  enableNugCalculation?: boolean;
}

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
    // Use authenticatedFetch to ensure auth token is included
    const { authenticatedFetch } = await import('./apiClient');
    const data = await authenticatedFetch<{ success: boolean; data?: ProductType[]; message?: string }>(`/products/types`);

    if (data.success && data.data) {
      productTypesCache = data.data;
      cacheTimestamp = now;
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch product types');
    }
  } catch (error: any) {
    console.error('Error fetching product types:', error);
    // Check if it's a permission error
    const errorMessage = error?.message || error?.toString() || '';
    if (errorMessage.includes('Permission') || errorMessage.includes('403') || errorMessage.includes('401')) {
      // Don't return fallback if it's a permission error - throw it
      throw new Error('You do not have permission to view product types. Please contact your administrator.');
    }
    // Return fallback product types only for other errors (network, server down, etc.)
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


// Utility functions for product types
import { getApiUrl, fetchJson } from './apiClient';

export interface ProductType {
  id: string;
  name: string;
  value: string;
  allowedTransactions?: ('sale' | 'purchase')[];
  enableNugCalculation?: boolean;
}

export const fetchProductTypes = async (): Promise<ProductType[]> => {
  try {
    // Use authenticatedFetch to ensure auth token is included
    const { authenticatedFetch } = await import('./apiClient');
    const data = await authenticatedFetch<{ success: boolean; data?: ProductType[]; message?: string }>(`/products/types`);

    if (data.success && data.data) {
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




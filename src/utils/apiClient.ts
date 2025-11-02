/**
 * API Client Utility
 * Handles API calls with proper error handling and JSON validation
 */
import { getApiUrl as getApiUrlFromUtils } from './api';

// Re-export getApiUrl for convenience
export const getApiUrl = getApiUrlFromUtils;

/**
 * Safe JSON fetch - validates response before parsing
 */
export const safeJsonFetch = async (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  const response = await fetch(url, options);
  
  // Check if response is OK
  if (!response.ok) {
    // Try to get error message from response
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      }
    } catch (e) {
      // Ignore parse errors for error responses
    }
    throw new Error(errorMessage);
  }
  
  // Validate content type
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 200)}`);
  }
  
  return response;
};

/**
 * Fetch and parse JSON with error handling
 */
export const fetchJson = async <T = any>(
  url: string,
  options?: RequestInit
): Promise<T> => {
  const response = await safeJsonFetch(url, options);
  return await response.json();
};

/**
 * Authenticated API call helper
 * Automatically adds auth token and validates response
 */
export const authenticatedFetch = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const apiUrl = getApiUrl();
  const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetchJson<T>(`${apiUrl}${endpoint}`, {
    ...options,
    headers,
  });
};


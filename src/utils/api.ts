/**
 * Get the API base URL
 * If VITE_API_URL is a relative path (starts with /), use the full backend URL
 * Otherwise, use the configured VITE_API_URL
 */
export const getApiUrl = (): string => {
  const envApiUrl = import.meta.env.VITE_API_URL;
  
  // If no env var or it's a relative path
  if (!envApiUrl || envApiUrl.startsWith('/')) {
    // If running on localhost, use local backend
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5001/api';
    }
    // Otherwise use production backend
    return 'https://fm-backend-six.vercel.app/api';
  }
  
  // If it already ends with /api, use as is
  if (envApiUrl.endsWith('/api')) {
    return envApiUrl;
  }
  
  // If it doesn't end with /api, append it
  return `${envApiUrl}/api`;
};


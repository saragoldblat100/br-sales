import axios, { AxiosError, AxiosRequestConfig } from 'axios';

/**
 * API Base URL
 * Uses Vite proxy in development, full URL in production
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Token storage key
 */
const TOKEN_KEY = 'authToken';

/**
 * Get stored auth token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Set auth token
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Remove auth token
 */
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Axios instance with default configuration
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor
 * Adds authorization header if token exists
 */
api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Remove Content-Type for FormData - let axios set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Handles authentication errors and preserves error response data
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Only redirect if we're not already on the login page
      // and only if we had a token (meaning we were logged in)
      const hadToken = !!getToken();
      removeToken();
      localStorage.removeItem('user');

      // Only redirect if we had a token and we're not on login page
      if (hadToken && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Create error object that preserves response data for client-side handling
    const customError = new Error(error.response?.data?.message || error.message);
    // Attach the full response data to the error object so it can be accessed as isAxiosError(err)
    (customError as any).response = error.response;
    (customError as any).isAxiosError = true;
    (customError as any).code = error.code;

    return Promise.reject(customError);
  }
);

/**
 * Type-safe API request wrapper
 */
export async function apiRequest<T>(
  config: AxiosRequestConfig
): Promise<T> {
  const response = await api.request<{ success: true; data: T }>(config);
  return response.data.data;
}

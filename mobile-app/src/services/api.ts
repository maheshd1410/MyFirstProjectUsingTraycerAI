/**
 * Axios API Service with Automatic Token Refresh
 * 
 * Token Flow Architecture:
 * 1. Storage ↔ Redux Sync:
 *    - AsyncStorage: saveTokens() → loads via getAccessToken(), getRefreshToken()
 *    - Redux: loadUserFromStorage() thunk syncs storage with Redux state on app start
 *    - Components: useAuth() hook accesses tokens from Redux state
 * 
 * 2. Request Flow:
 *    - Request interceptor: Attaches access token from AsyncStorage to Authorization header
 *    - All API calls use: Authorization: Bearer <accessToken>
 * 
 * 3. Token Refresh Flow (on 401):
 *    - Response interceptor detects 401 error
 *    - Queues concurrent requests (prevents multiple simultaneous refreshes)
 *    - POST /api/auth/refresh-token with stored refreshToken
 *    - Backend validates stored token, rotates both tokens, returns both
 *    - saveTokens() persists new tokens to AsyncStorage
 *    - Redux state updated via refreshAccessToken thunk (if dispatched separately)
 *    - Retries original request with new accessToken
 *    - Queued requests released with new token
 * 
 * 4. Logout & Error Handling:
 *    - clearTokens() removes from AsyncStorage and Redux
 *    - Failed refresh dispatches logoutUser() thunk for full reset
 *    - Navigation to login handled by RootNavigator watching isAuthenticated
 * 
 * 5. Protected Routes & Role-Based Access:
 *    - useAuth() returns isAuthenticated flag
 *    - useRequireAuth(role?) enforces role-based guards
 *    - RootNavigator shows AuthNavigator if !isAuthenticated, AppNavigator otherwise
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../utils/tokenStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
});

// Configure axios-retry
axiosRetry(api, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay, // 1s, 2s, 4s
  retryCondition: (error) => {
    // Retry on network errors and specific HTTP status codes
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ENETUNREACH' ||
      error.response?.status === 408 || // Request Timeout
      error.response?.status === 429 || // Too Many Requests
      error.response?.status === 503 || // Service Unavailable
      error.response?.status === 504 // Gateway Timeout
    );
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.log(`[API Retry] Attempt ${retryCount} for ${requestConfig.url}:`, error.message);
    
    // Add retry attempt counter to headers
    if (requestConfig.headers) {
      requestConfig.headers['X-Retry-Count'] = retryCount.toString();
    }
  },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
const pendingRequests = new Map<string, boolean>();

/**
 * Subscribe to token refresh
 */
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

/**
 * Add request to refresh queue
 */
const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

/**
 * Request interceptor to attach authorization token and prevent duplicates
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Request deduplication
    const requestKey = `${config.method}-${config.url}-${JSON.stringify(config.params)}`;
    if (pendingRequests.has(requestKey)) {
      console.log(`[API] Duplicate request blocked: ${requestKey}`);
      return Promise.reject(new Error('Duplicate request'));
    }
    pendingRequests.set(requestKey, true);
    
    // Clean up after response
    if (config.signal) {
      config.signal.addEventListener('abort', () => {
        pendingRequests.delete(requestKey);
      });
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle token refresh and errors
 */
api.interceptors.response.use(
  (response) => {
    // Clear request from pending map
    const requestKey = `${response.config.method}-${response.config.url}-${JSON.stringify(response.config.params)}`;
    pendingRequests.delete(requestKey);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Clear request from pending map
    if (originalRequest) {
      const requestKey = `${originalRequest.method}-${originalRequest.url}-${JSON.stringify(originalRequest.params)}`;
      pendingRequests.delete(requestKey);
    }

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Log if new refresh token missing (backend should always return it)
        if (!newRefreshToken) {
          console.warn('[Token Refresh] Backend did not return new refresh token, using previous token');
        }
        
        // Save both tokens to AsyncStorage with fallback to previous refresh token
        await saveTokens(accessToken, newRefreshToken || refreshToken);
        
        // Update the original request with the new access token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Notify all pending requests
        onRefreshed(accessToken);

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        await clearTokens();
        console.error('[Token Refresh] Refresh failed, tokens cleared:', refreshError);
        // Dispatch logout action or navigate to login
        // This should be handled in the Redux store via Redux middleware or listener
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

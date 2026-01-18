import api from './api';
import { LoginCredentials, RegisterData, AuthResponse, User } from '../types';
import { oauthService } from './oauth.service';

/**
 * Register a new user
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

/**
 * Login with email and password
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

/**
 * Login with OAuth (Google or Apple)
 */
export const loginWithOAuth = async (provider: 'google' | 'apple', callbackUrl: string): Promise<AuthResponse> => {
  // Parse tokens from callback URL
  const { token, refreshToken, isNewUser } = oauthService.exchangeCodeForTokens(callbackUrl);

  // Fetch user data
  const userResponse = await api.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return {
    user: userResponse.data,
    accessToken: token,
    refreshToken,
    isNewUser,
  };
};

/**
 * Refresh access token
 */
export const refreshToken = async (refreshToken: string): Promise<{ accessToken: string }> => {
  const response = await api.post('/auth/refresh-token', { refreshToken });
  return response.data;
};

/**
 * Logout user
 */
export const logout = async (): Promise<{ message: string }> => {
  const response = await api.post('/auth/logout');
  return response.data;
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/auth/me');
  return response.data;
};

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { oauthEndpoints, OAUTH_REDIRECT_URI } from '../config/oauth';
import api from './api';

// Enable web browser for OAuth
WebBrowser.maybeCompleteAuthSession();

export interface OAuthTokenResponse {
  token: string;
  refreshToken: string;
  isNewUser: boolean;
}

export const oauthService = {
  /**
   * Initiate Google OAuth flow
   */
  initiateGoogleAuth: async (): Promise<string> => {
    try {
      // Open browser for Google OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        oauthEndpoints.google.authorizationEndpoint,
        OAUTH_REDIRECT_URI
      );

      if (result.type === 'success' && result.url) {
        return result.url;
      }

      throw new Error('Google authentication was cancelled or failed');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to initiate Google authentication');
    }
  },

  /**
   * Initiate Apple OAuth flow
   */
  initiateAppleAuth: async (): Promise<string> => {
    try {
      // Open browser for Apple OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        oauthEndpoints.apple.authorizationEndpoint,
        OAUTH_REDIRECT_URI
      );

      if (result.type === 'success' && result.url) {
        return result.url;
      }

      throw new Error('Apple authentication was cancelled or failed');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to initiate Apple authentication');
    }
  },

  /**
   * Exchange authorization code for tokens
   * Note: This is handled by the backend via OAuth callback
   * This function parses the callback URL for tokens
   */
  exchangeCodeForTokens: (callbackUrl: string): OAuthTokenResponse => {
    const url = new URL(callbackUrl);
    const token = url.searchParams.get('token');
    const refreshToken = url.searchParams.get('refreshToken');
    const isNewUser = url.searchParams.get('isNewUser') === 'true';
    const error = url.searchParams.get('error');
    const message = url.searchParams.get('message');

    if (error || !token || !refreshToken) {
      throw new Error(message || 'Failed to authenticate');
    }

    return { token, refreshToken, isNewUser };
  },

  /**
   * Link OAuth account to existing user
   */
  linkOAuthAccount: async (provider: 'google' | 'apple', accessToken: string): Promise<void> => {
    const response = await api.post('/auth/oauth/link', {
      provider,
      accessToken,
    });
    return response.data;
  },

  /**
   * Unlink OAuth account from user
   */
  unlinkOAuthAccount: async (provider: 'google' | 'apple'): Promise<void> => {
    const response = await api.delete(`/auth/oauth/unlink/${provider}`);
    return response.data;
  },
};

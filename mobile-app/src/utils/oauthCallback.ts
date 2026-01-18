import { oauthService } from '../services/oauth.service';
import * as tokenStorage from './tokenStorage';

export interface OAuthCallbackResult {
  success: boolean;
  error?: string;
  isNewUser?: boolean;
}

/**
 * Handle OAuth callback from deep link
 */
export const handleOAuthCallback = async (url: string): Promise<OAuthCallbackResult> => {
  try {
    // Check if URL matches OAuth callback pattern
    if (!url.includes('token=') && !url.includes('error=')) {
      return { success: false, error: 'Invalid OAuth callback URL' };
    }

    // Parse URL for error
    const urlObj = new URL(url);
    const error = urlObj.searchParams.get('error');
    const errorMessage = urlObj.searchParams.get('message');

    if (error) {
      return {
        success: false,
        error: errorMessage || 'OAuth authentication failed',
      };
    }

    // Parse tokens from URL
    const token = urlObj.searchParams.get('token');
    const refreshToken = urlObj.searchParams.get('refreshToken');
    const isNewUser = urlObj.searchParams.get('isNewUser') === 'true';

    if (!token || !refreshToken) {
      return { success: false, error: 'Failed to receive authentication tokens' };
    }

    // Save tokens to storage
    await tokenStorage.saveTokens(token, refreshToken);

    return {
      success: true,
      isNewUser,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to process OAuth callback',
    };
  }
};

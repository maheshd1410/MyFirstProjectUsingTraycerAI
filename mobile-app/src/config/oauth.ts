import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

// OAuth Configuration
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
export const APPLE_CLIENT_ID = process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || '';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

// Deep linking redirect URI (must match app.json scheme)
export const OAUTH_REDIRECT_URI = 'ladoobusiness://oauth-callback';

// Google OAuth Configuration
export const googleOAuthConfig = {
  clientId: Platform.select({
    ios: GOOGLE_IOS_CLIENT_ID,
    android: GOOGLE_ANDROID_CLIENT_ID,
    default: GOOGLE_IOS_CLIENT_ID,
  }),
  scopes: ['profile', 'email'],
  redirectUri: OAUTH_REDIRECT_URI,
};

// Apple OAuth Configuration
export const appleOAuthConfig = {
  clientId: APPLE_CLIENT_ID,
  scopes: ['name', 'email'],
  redirectUri: OAUTH_REDIRECT_URI,
};

// OAuth Endpoints
export const oauthEndpoints = {
  google: {
     authorizationEndpoint: `${API_BASE_URL}/auth/google`,
     tokenEndpoint: `${API_BASE_URL}/auth/google/callback`,
  },
  apple: {
     authorizationEndpoint: `${API_BASE_URL}/auth/apple`,
     tokenEndpoint: `${API_BASE_URL}/auth/apple/callback`,
  },
};

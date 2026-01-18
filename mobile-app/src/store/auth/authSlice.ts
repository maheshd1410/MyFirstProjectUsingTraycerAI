import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as Notifications from 'expo-notifications';
import * as authService from '../../services/auth.service';
import * as notificationService from '../../services/notification.service';
import * as tokenStorage from '../../utils/tokenStorage';
import { oauthService } from '../../services/oauth.service';
import { AuthState, User, LoginCredentials, RegisterData } from '../../types';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

/**
 * Register FCM token after successful login/register
 */
const registerFcmToken = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') {
      // Get native device push token (FCM token for Android, APNs for iOS)
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      // Extract the FCM token from the platform-specific response
      const fcmToken = deviceToken.data;
      if (fcmToken) {
        console.log('Registering FCM token with backend:', fcmToken);
        await notificationService.registerFcmToken(fcmToken);
      }
    }
  } catch (error) {
    console.error('Failed to register FCM token:', error);
    // Don't throw - FCM registration failure shouldn't break login
  }
};

/**
 * Async thunk for login
 */
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      await tokenStorage.saveTokens(response.accessToken, response.refreshToken);
      
      // Register FCM token after successful login
      await registerFcmToken();
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

/**
 * Async thunk for registration
 */
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (data: RegisterData, { rejectWithValue }) => {
    try {
      const response = await authService.register(data);
      await tokenStorage.saveTokens(response.accessToken, response.refreshToken);
      
      // Register FCM token after successful registration
      await registerFcmToken();
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Registration failed');
    }
  }
);

/**
 * Async thunk for logout
 */
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // Remove FCM token before logout
      await notificationService.removeFcmToken();
      
      await authService.logout();
      await tokenStorage.clearTokens();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Logout failed');
    }
  }
);

/**
 * Async thunk for Google OAuth login
 */
export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      const callbackUrl = await oauthService.initiateGoogleAuth();
      const response = await authService.loginWithOAuth('google', callbackUrl);
      await tokenStorage.saveTokens(response.accessToken, response.refreshToken);
      
      // Register FCM token after successful login
      await registerFcmToken();
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Google login failed');
    }
  }
);

/**
 * Async thunk for Apple OAuth login
 */
export const loginWithApple = createAsyncThunk(
  'auth/loginWithApple',
  async (_, { rejectWithValue }) => {
    try {
      const callbackUrl = await oauthService.initiateAppleAuth();
      const response = await authService.loginWithOAuth('apple', callbackUrl);
      await tokenStorage.saveTokens(response.accessToken, response.refreshToken);
      
      // Register FCM token after successful login
      await registerFcmToken();
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Apple login failed');
    }
  }
);

/**
 * Async thunk for linking OAuth account
 */
export const linkOAuthAccount = createAsyncThunk(
  'auth/linkOAuthAccount',
  async ({ provider, accessToken }: { provider: 'google' | 'apple'; accessToken: string }, { rejectWithValue }) => {
    try {
      await oauthService.linkOAuthAccount(provider, accessToken);
      
      // Fetch updated user data
      const user = await authService.getCurrentUser();
      return user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to link OAuth account');
    }
  }
);

/**
 * Async thunk for unlinking OAuth account
 */
export const unlinkOAuthAccount = createAsyncThunk(
  'auth/unlinkOAuthAccount',
  async (provider: 'google' | 'apple', { rejectWithValue }) => {
    try {
      await oauthService.unlinkOAuthAccount(provider);
      
      // Fetch updated user data
      const user = await authService.getCurrentUser();
      return user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to unlink OAuth account');
    }
  }
);

/**
 * Async thunk to load user from storage on app start
 */
export const loadUserFromStorage = createAsyncThunk(
  'auth/loadUserFromStorage',
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = await tokenStorage.getAccessToken();
      const refreshToken = await tokenStorage.getRefreshToken();

      if (!accessToken || !refreshToken) {
        return null;
      }

      // Try to get current user
      const user = await authService.getCurrentUser();
      return { user, accessToken, refreshToken };
    } catch (error: any) {
      // Token may be expired, clear and return null
      await tokenStorage.clearTokens();
      return rejectWithValue(error.response?.data?.error || 'Failed to load user');
    }
  }
);

/**
 * Async thunk to refresh access token
 */
export const refreshAccessToken = createAsyncThunk(
  'auth/refreshAccessToken',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: AuthState };
      const refreshToken = state.auth.refreshToken;

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(refreshToken);
      await tokenStorage.saveTokens(response.accessToken, state.auth.refreshToken!);
      return response.accessToken;
    } catch (error: any) {
      await tokenStorage.clearTokens();
      return rejectWithValue(error.response?.data?.error || 'Token refresh failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Google Login
    builder
      .addCase(loginWithGoogle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Apple Login
    builder
      .addCase(loginWithApple.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithApple.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(loginWithApple.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Link OAuth Account
    builder
      .addCase(linkOAuthAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(linkOAuthAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(linkOAuthAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Unlink OAuth Account
    builder
      .addCase(unlinkOAuthAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unlinkOAuthAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(unlinkOAuthAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load from storage
    builder
      .addCase(loadUserFromStorage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUserFromStorage.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.isAuthenticated = true;
        }
      })
      .addCase(loadUserFromStorage.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });

    // Refresh token
    builder
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, resetAuth, setUser } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken;

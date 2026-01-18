import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { WishlistState } from '../../types';
import * as wishlistService from '../../services/wishlist.service';
import { logoutUser } from '../auth/authSlice';

const initialState: WishlistState = {
  wishlist: null,
  loading: {
    fetch: false,
    refresh: false,
    loadMore: false,
    action: false,
    upload: false,
  },
  error: null,
  optimisticUpdates: [],
};

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await wishlistService.getWishlist();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch wishlist');
    }
  }
);

export const addToWishlistAsync = createAsyncThunk(
  'wishlist/addToWishlist',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await wishlistService.addToWishlist(productId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add to wishlist');
    }
  }
);

export const removeFromWishlistAsync = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await wishlistService.removeFromWishlist(productId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to remove from wishlist');
    }
  }
);

export const clearWishlistAsync = createAsyncThunk(
  'wishlist/clearWishlist',
  async (_, { rejectWithValue }) => {
    try {
      await wishlistService.clearWishlist();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to clear wishlist');
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetWishlist: (state) => {
      state.wishlist = null;
      state.loading = {
        fetch: false,
        refresh: false,
        loadMore: false,
        action: false,
        upload: false,
      };
      state.error = null;
      state.optimisticUpdates = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading.fetch = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.wishlist = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.payload as string;
      })
      .addCase(addToWishlistAsync.pending, (state, action) => {
        state.loading.action = true;
        state.error = null;
        // Optimistic update - add item immediately
        const optimisticId = `temp-${Date.now()}`;
        state.optimisticUpdates.push({
          id: optimisticId,
          type: 'add',
          data: {
            id: optimisticId,
            productId: action.meta.arg,
            product: {} as any, // Will be populated by server
            createdAt: new Date().toISOString(),
          },
          timestamp: Date.now(),
        });
      })
      .addCase(addToWishlistAsync.fulfilled, (state, action) => {
        state.loading.action = false;
        state.wishlist = action.payload;
        state.optimisticUpdates = [];
      })
      .addCase(addToWishlistAsync.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload as string;
        state.optimisticUpdates = [];
      })
      .addCase(removeFromWishlistAsync.pending, (state, action) => {
        state.loading.action = true;
        state.error = null;
        // Optimistic update - remove item immediately
        if (state.wishlist?.items) {
          const itemToRemove = state.wishlist.items.find(i => i.productId === action.meta.arg);
          if (itemToRemove) {
            state.optimisticUpdates.push({
              id: action.meta.arg,
              type: 'remove',
              data: itemToRemove,
              timestamp: Date.now(),
            });
            state.wishlist.items = state.wishlist.items.filter(i => i.productId !== action.meta.arg);
          }
        }
      })
      .addCase(removeFromWishlistAsync.fulfilled, (state, action) => {
        state.loading.action = false;
        state.wishlist = action.payload;
        state.optimisticUpdates = [];
      })
      .addCase(removeFromWishlistAsync.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload as string;
        // Rollback - restore removed item
        if (state.wishlist?.items && state.optimisticUpdates.length > 0) {
          const rollback = state.optimisticUpdates[0];
          if (rollback.type === 'remove' && rollback.data) {
            state.wishlist.items.push(rollback.data);
          }
        }
        state.optimisticUpdates = [];
      })
      .addCase(clearWishlistAsync.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(clearWishlistAsync.fulfilled, (state) => {
        state.loading.action = false;
        state.wishlist = null;
      })
      .addCase(clearWishlistAsync.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.wishlist = null;
        state.loading = {
          fetch: false,
          refresh: false,
          loadMore: false,
          action: false,
          upload: false,
        };
        state.error = null;
        state.optimisticUpdates = [];
      });
  },
});

export const { clearError, resetWishlist } = wishlistSlice.actions;

export default wishlistSlice.reducer;

// Selectors
export const selectWishlist = (state: any) => state.wishlist.wishlist;
export const selectWishlistItems = (state: any) => state.wishlist.wishlist?.items ?? [];
export const selectWishlistItemCount = (state: any) => state.wishlist.wishlist?.totalItems ?? 0;
export const selectWishlistLoading = (state: any) => state.wishlist.loading;
export const selectWishlistError = (state: any) => state.wishlist.error;
export const selectIsInWishlist = (productId: string) => (state: any) =>
  state.wishlist.wishlist?.items?.some((item: any) => item.productId === productId) ?? false;

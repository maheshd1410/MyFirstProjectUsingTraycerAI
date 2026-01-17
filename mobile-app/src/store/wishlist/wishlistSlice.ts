import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { WishlistState } from '../../types';
import * as wishlistService from '../../services/wishlist.service';
import { logoutUser } from '../auth/authSlice';

const initialState: WishlistState = {
  wishlist: null,
  loading: false,
  error: null,
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
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.wishlist = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addToWishlistAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToWishlistAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.wishlist = action.payload;
      })
      .addCase(addToWishlistAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(removeFromWishlistAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromWishlistAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.wishlist = action.payload;
      })
      .addCase(removeFromWishlistAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(clearWishlistAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearWishlistAsync.fulfilled, (state) => {
        state.loading = false;
        state.wishlist = null;
      })
      .addCase(clearWishlistAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.wishlist = null;
        state.loading = false;
        state.error = null;
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

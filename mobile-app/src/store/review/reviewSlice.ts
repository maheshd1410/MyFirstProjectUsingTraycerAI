import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Review, ReviewState, CreateReviewData, UpdateReviewData, ReviewFilterParams } from '../../types';
import * as reviewService from '../../services/review.service';
import { RootState } from '../index';

const initialState: ReviewState = {
  reviews: [],
  userReviews: [],
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  },
};

// Async Thunks
export const createReview = createAsyncThunk(
  'review/createReview',
  async (data: CreateReviewData, { rejectWithValue }) => {
    try {
      const response = await reviewService.createReview(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create review');
    }
  }
);

export const updateReview = createAsyncThunk(
  'review/updateReview',
  async ({ reviewId, data }: { reviewId: string; data: UpdateReviewData }, { rejectWithValue }) => {
    try {
      const response = await reviewService.updateReview(reviewId, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update review');
    }
  }
);

export const deleteReview = createAsyncThunk(
  'review/deleteReview',
  async (reviewId: string, { rejectWithValue }) => {
    try {
      await reviewService.deleteReview(reviewId);
      return reviewId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete review');
    }
  }
);

export const fetchProductReviews = createAsyncThunk(
  'review/fetchProductReviews',
  async (
    { productId, filters }: { productId: string; filters?: ReviewFilterParams },
    { rejectWithValue }
  ) => {
    try {
      const response = await reviewService.getProductReviews(productId, filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reviews');
    }
  }
);

export const fetchUserReviews = createAsyncThunk(
  'review/fetchUserReviews',
  async (_, { rejectWithValue }) => {
    try {
      const response = await reviewService.getUserReviews();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user reviews');
    }
  }
);

// Slice
const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {
    clearReviews: (state) => {
      state.reviews = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<ReviewFilterParams>) => {
      // Filter update logic can be added here if needed
    },
  },
  extraReducers: (builder) => {
    // Create Review
    builder
      .addCase(createReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading = false;
        // Add created review to reviews list so it appears immediately on product detail
        state.reviews.unshift(action.payload);
        // Also add to user reviews
        state.userReviews.push(action.payload);
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update Review
    builder
      .addCase(updateReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.reviews.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.reviews[index] = action.payload;
        }
        const userIndex = state.userReviews.findIndex((r) => r.id === action.payload.id);
        if (userIndex !== -1) {
          state.userReviews[userIndex] = action.payload;
        }
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete Review
    builder
      .addCase(deleteReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = state.reviews.filter((r) => r.id !== action.payload);
        state.userReviews = state.userReviews.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch Product Reviews
    builder
      .addCase(fetchProductReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.reviews;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch User Reviews
    builder
      .addCase(fetchUserReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.userReviews = action.payload;
      })
      .addCase(fetchUserReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Selectors
export const selectReviews = (state: RootState) => state.review.reviews;
export const selectUserReviews = (state: RootState) => state.review.userReviews;
export const selectReviewLoading = (state: RootState) => state.review.loading;
export const selectReviewError = (state: RootState) => state.review.error;
export const selectReviewPagination = (state: RootState) => state.review.pagination;

export const { clearReviews, clearError, setFilters } = reviewSlice.actions;
export default reviewSlice.reducer;

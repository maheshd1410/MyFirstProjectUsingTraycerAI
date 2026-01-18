import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CartState, Cart, CartItem } from '../../types';
import * as cartService from '../../services/cart.service';
import { logoutUser } from '../auth/authSlice';

const initialState: CartState = {
  cart: null,
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

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartService.getCart();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch cart');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity, variantId }: { productId: string; quantity: number; variantId?: string }, { rejectWithValue }) => {
    try {
      const response = await cartService.addToCart(productId, quantity, variantId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add item to cart');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }: { itemId: string; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await cartService.updateCartItem(itemId, quantity);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update cart item');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId: string, { rejectWithValue }) => {
    try {
      const response = await cartService.removeCartItem(itemId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to remove item from cart');
    }
  }
);

export const clearCartAsync = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      await cartService.clearCart();
      return null; // Return null to clear cart
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to clear cart');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetCart: (state) => {
      state.cart = null;
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
    // Fetch Cart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading.fetch = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.cart = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.payload as string;
      });

    // Add to Cart
    builder
      .addCase(addToCart.pending, (state, action) => {
        state.loading.action = true;
        state.error = null;
        // Optimistic update - add temporary item
        const optimisticId = `temp-${Date.now()}`;
        const tempItem: CartItem = {
          id: optimisticId,
          productId: action.meta.arg.productId,
          productName: 'Loading...',
          productImage: '',
          price: '0',
          quantity: action.meta.arg.quantity,
          subtotal: '0',
          createdAt: new Date().toISOString(),
        };
        
        // Record optimistic update
        state.optimisticUpdates.push({
          id: optimisticId,
          type: 'add',
          data: tempItem,
          timestamp: Date.now(),
        });
        
        // Insert temp item into cart.items array
        if (!state.cart) {
          state.cart = {
            id: 'temp-cart',
            userId: 'temp',
            items: [],
            totalItems: 0,
            totalAmount: '0',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        state.cart.items.push(tempItem);
        state.cart.totalItems += action.meta.arg.quantity;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading.action = false;
        state.cart = action.payload;
        // Clear optimistic updates
        state.optimisticUpdates = [];
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload as string;
        // Remove optimistic update on error
        state.optimisticUpdates = [];
      });

    // Update Cart Item
    builder
      .addCase(updateCartItem.pending, (state, action) => {
        state.loading.action = true;
        state.error = null;
        // Optimistic update - update quantity immediately
        if (state.cart?.items) {
          const item = state.cart.items.find(i => i.id === action.meta.arg.itemId);
          if (item) {
            const previousQuantity = item.quantity;
            item.quantity = action.meta.arg.quantity;
            // Store previous state for rollback
            state.optimisticUpdates.push({
              id: action.meta.arg.itemId,
              type: 'update',
              data: { ...item, quantity: previousQuantity },
              timestamp: Date.now(),
            });
          }
        }
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading.action = false;
        state.cart = action.payload;
        state.optimisticUpdates = [];
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload as string;
        // Rollback optimistic update
        if (state.cart?.items && state.optimisticUpdates.length > 0) {
          const rollback = state.optimisticUpdates[0];
          const item = state.cart.items.find(i => i.id === rollback.id);
          if (item && rollback.data) {
            item.quantity = rollback.data.quantity;
          }
        }
        state.optimisticUpdates = [];
      });

    // Remove from Cart
    builder
      .addCase(removeFromCart.pending, (state, action) => {
        state.loading.action = true;
        state.error = null;
        // Optimistic update - remove item immediately
        if (state.cart?.items) {
          const itemToRemove = state.cart.items.find(i => i.id === action.meta.arg);
          if (itemToRemove) {
            state.optimisticUpdates.push({
              id: action.meta.arg,
              type: 'remove',
              data: itemToRemove,
              timestamp: Date.now(),
            });
            state.cart.items = state.cart.items.filter(i => i.id !== action.meta.arg);
          }
        }
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading.action = false;
        state.cart = action.payload;
        state.optimisticUpdates = [];
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload as string;
        // Rollback - restore removed item
        if (state.cart?.items && state.optimisticUpdates.length > 0) {
          const rollback = state.optimisticUpdates[0];
          if (rollback.type === 'remove' && rollback.data) {
            state.cart.items.push(rollback.data);
          }
        }
        state.optimisticUpdates = [];
      });

    // Clear Cart
    builder
      .addCase(clearCartAsync.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(clearCartAsync.fulfilled, (state) => {
        state.loading.action = false;
        state.cart = null;
      })
      .addCase(clearCartAsync.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload as string;
      });

    // Handle logout - clear cart state when user logs out
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.cart = null;
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

export const { clearError, resetCart } = cartSlice.actions;

export default cartSlice.reducer;

// Selectors
export const selectCart = (state: { cart: CartState }) => state.cart.cart;
export const selectCartItems = (state: { cart: CartState }) =>
  state.cart.cart?.items ?? [];
export const selectCartTotal = (state: { cart: CartState }) =>
  state.cart.cart?.totalAmount ?? '0';
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.cart?.totalItems ?? 0;
export const selectCartLoading = (state: { cart: CartState }) => state.cart.loading;
export const selectCartError = (state: { cart: CartState }) => state.cart.error;
export const selectCartLoadingState = (state: { cart: CartState }) => state.cart.loading;
export const selectCartOptimisticUpdates = (state: { cart: CartState }) => 
  state.cart.optimisticUpdates;

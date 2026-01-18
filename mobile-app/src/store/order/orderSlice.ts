import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  OrderState,
  Order,
  CreateOrderRequest,
  OrderFilterParams,
} from '../../types';
import * as orderService from '../../services/order.service';
import { logoutUser } from '../auth/authSlice';

const initialState: OrderState = {
  orders: [],
  selectedOrder: null,
  loading: {
    fetch: false,
    refresh: false,
    loadMore: false,
    action: false,
    upload: false,
  },
  error: null,
  pagination: {
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  },
};

// Async thunks
export const fetchOrders = createAsyncThunk(
  'order/fetchOrders',
  async (filters?: OrderFilterParams, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrders(filters);
      // Returns PaginatedOrders with orders array and pagination metadata
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch orders');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'order/fetchOrderById',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrderById(orderId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch order');
    }
  }
);

export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (data: CreateOrderRequest, { rejectWithValue }) => {
    try {
      const response = await orderService.createOrder(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create order');
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'order/cancelOrder',
  async (
    { orderId, cancellationReason }: { orderId: string; cancellationReason: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await orderService.cancelOrder(orderId, cancellationReason);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to cancel order');
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetOrders: (state) => {
      state.orders = [];
      state.selectedOrder = null;
      state.loading = {
        fetch: false,
        refresh: false,
        loadMore: false,
        action: false,
        upload: false,
      };
      state.error = null;
      state.pagination = {
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 1,
      };
    },
    setSelectedOrder: (state, action: PayloadAction<Order | null>) => {
      state.selectedOrder = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Orders
    builder
      .addCase(fetchOrders.pending, (state, action) => {
        // Use fetch for first page, loadMore for pagination
        if (action.meta.arg?.page === 1 || !action.meta.arg?.page) {
          state.loading.fetch = true;
        } else {
          state.loading.loadMore = true;
        }
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.loading.loadMore = false;
        // action.payload is PaginatedOrders with orders and pagination metadata from backend
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading.fetch = false;
        state.loading.loadMore = false;
        state.error = action.payload as string;
      });

    // Fetch Order By ID
    builder
      .addCase(fetchOrderById.pending, (state) => {
        state.loading.fetch = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.payload as string;
      });

    // Create Order
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading.action = false;
        // Set selectedOrder to the newly created order
        state.selectedOrder = action.payload;
        // Don't modify orders/pagination here - let UI refetch orders if needed
        // This prevents inconsistency when creating order with filters applied
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload as string;
      });

    // Cancel Order
    builder
      .addCase(cancelOrder.pending, (state) => {
        state.loading.action = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading.action = false;
        // Update the order in the orders array if present
        const index = state.orders.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        // Update selected order if it matches
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
        // Don't modify pagination here - let UI refetch orders if needed to get accurate counts
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading.action = false;
        state.error = action.payload as string;
      });

    // Handle logout - clear order state when user logs out
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.orders = [];
      state.selectedOrder = null;
      state.loading = {
        fetch: false,
        refresh: false,
        loadMore: false,
        action: false,
        upload: false,
      };
      state.error = null;
      state.pagination = {
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 1,
      };
    });
  },
});

export const { clearError, resetOrders, setSelectedOrder } = orderSlice.actions;

export default orderSlice.reducer;

// Selectors
export const selectOrders = (state: { order: OrderState }) => state.order.orders;
export const selectSelectedOrder = (state: { order: OrderState }) =>
  state.order.selectedOrder;
export const selectOrderLoading = (state: { order: OrderState }) => state.order.loading;
export const selectOrderError = (state: { order: OrderState }) => state.order.error;
export const selectOrderPagination = (state: { order: OrderState }) =>
  state.order.pagination;

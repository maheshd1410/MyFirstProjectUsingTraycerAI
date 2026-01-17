import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  AdminState,
  AdminAnalytics,
  AdminOrderFilters,
  AdminUserFilters,
  UserManagement,
  UserManagementDetail,
} from '../../types';
import { adminService } from '../../services/admin.service';
import { RootState } from './index';

const initialState: AdminState = {
  analytics: null,
  orders: [],
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
  orderPagination: null,
  userPagination: null,
};

export const fetchAnalytics = createAsyncThunk('admin/fetchAnalytics', async () => {
  return await adminService.getAnalytics();
});

export const fetchAllOrders = createAsyncThunk(
  'admin/fetchAllOrders',
  async (filters: AdminOrderFilters) => {
    return await adminService.getAllOrders(filters);
  }
);

export const fetchAllUsers = createAsyncThunk(
  'admin/fetchAllUsers',
  async (filters: AdminUserFilters) => {
    return await adminService.getAllUsers(filters);
  }
);

export const fetchUserById = createAsyncThunk(
  'admin/fetchUserById',
  async (userId: string) => {
    return await adminService.getUserById(userId);
  }
);

export const updateUserStatus = createAsyncThunk(
  'admin/updateUserStatus',
  async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
    return await adminService.updateUserStatus(userId, isActive);
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetAdmin: () => initialState,
  },
  extraReducers: (builder) => {
    // fetchAnalytics
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch analytics';
      });

    // fetchAllOrders
    builder
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.data;
        state.orderPagination = action.payload.pagination;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch orders';
      });

    // fetchAllUsers
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data;
        state.userPagination = action.payload.pagination;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch users';
      });

    // fetchUserById
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch user';
      });

    // updateUserStatus
    builder
      .addCase(updateUserStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedUser = action.payload;
        const userIndex = state.users.findIndex((u) => u.id === updatedUser.id);
        if (userIndex >= 0) {
          state.users[userIndex] = { ...state.users[userIndex], isActive: updatedUser.isActive };
        }
        if (state.selectedUser && state.selectedUser.id === updatedUser.id) {
          state.selectedUser.isActive = updatedUser.isActive;
        }
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update user status';
      });
  },
});

export const { clearError, resetAdmin } = adminSlice.actions;

// Selectors
export const selectAnalytics = (state: RootState) => state.admin.analytics;
export const selectAdminOrders = (state: RootState) => state.admin.orders;
export const selectAdminUsers = (state: RootState) => state.admin.users;
export const selectSelectedUser = (state: RootState) => state.admin.selectedUser;
export const selectAdminLoading = (state: RootState) => state.admin.loading;
export const selectAdminError = (state: RootState) => state.admin.error;
export const selectOrderPagination = (state: RootState) => state.admin.orderPagination;
export const selectUserPagination = (state: RootState) => state.admin.userPagination;

export default adminSlice.reducer;

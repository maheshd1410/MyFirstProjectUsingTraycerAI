import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as notificationService from '../../services/notification.service';
import { Notification } from '../../services/notification.service';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  page: 1,
  hasMore: true,
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async ({ page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {}) => {
    const response = await notificationService.getNotifications(page, pageSize);
    return response;
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId: string) => {
    await notificationService.markAsRead(notificationId);
    return notificationId;
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async () => {
    await notificationService.markAllAsRead();
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notification/fetchUnreadCount',
  async () => {
    const response = await notificationService.getNotifications(1, 1, true);
    return response.total;
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    resetNotifications: (state) => {
      state.notifications = [];
      state.page = 1;
      state.hasMore = true;
      state.error = null;
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        if (action.meta.arg.page === 1) {
          state.notifications = action.payload.notifications;
        } else {
          state.notifications = [...state.notifications, ...action.payload.notifications];
        }
        state.page = action.payload.page;
        state.hasMore = action.payload.notifications.length === action.meta.arg.pageSize;
        state.unreadCount = action.payload.notifications.filter(n => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch notifications';
      })

      // Mark as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })

      // Mark all as read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => {
          n.isRead = true;
        });
        state.unreadCount = 0;
      })

      // Fetch unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });
  },
});

export const { resetNotifications, incrementUnreadCount } = notificationSlice.actions;

// Selectors
export const selectNotifications = (state: { notification: NotificationState }) => state.notification.notifications;
export const selectUnreadCount = (state: { notification: NotificationState }) => state.notification.unreadCount;
export const selectNotificationLoading = (state: { notification: NotificationState }) => state.notification.loading;
export const selectNotificationError = (state: { notification: NotificationState }) => state.notification.error;
export const selectHasMore = (state: { notification: NotificationState }) => state.notification.hasMore;

export default notificationSlice.reducer;

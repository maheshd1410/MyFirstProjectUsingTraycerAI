import api from './api';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  orderUpdates: boolean;
  promotions: boolean;
  reviews: boolean;
}

export const registerFcmToken = async (token: string): Promise<void> => {
  try {
    await api.put('/auth/fcm-token', { fcmToken: token });
  } catch (error) {
    console.error('Failed to register FCM token:', error);
    // Don't throw - FCM registration failure shouldn't break the app
  }
};

export const removeFcmToken = async (): Promise<void> => {
  try {
    await api.delete('/auth/fcm-token');
  } catch (error) {
    console.error('Failed to remove FCM token:', error);
  }
};

export const getNotifications = async (
  page: number = 1,
  pageSize: number = 20,
  unreadOnly: boolean = false
): Promise<{ notifications: Notification[]; total: number; page: number; pageSize: number }> => {
  const response = await api.get('/notifications', {
    params: { page, pageSize, unreadOnly },
  });
  return response.data;
};

export const markAsRead = async (notificationId: string): Promise<void> => {
  await api.put(`/notifications/${notificationId}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await api.put('/notifications/read-all');
};

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await api.get('/notifications/preferences');
  return response.data;
};

export const updateNotificationPreferences = async (
  preferences: NotificationPreferences
): Promise<NotificationPreferences> => {
  const response = await api.put('/notifications/preferences', preferences);
  return response.data;
};

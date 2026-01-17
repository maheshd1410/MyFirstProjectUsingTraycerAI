import { prisma } from '../config/database';
import { getFirebaseAdmin, isFirebaseInitialized } from '../config/firebase';

export class NotificationService {
  private async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: { [key: string]: string }
  ): Promise<void> {
    if (!isFirebaseInitialized()) {
      console.warn('Firebase not initialized. Skipping push notification.');
      return;
    }

    try {
      const admin = getFirebaseAdmin();
      const message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'order-updates',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('✓ Push notification sent successfully:', response);
    } catch (error: any) {
      // Handle invalid token errors
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        console.warn('Invalid FCM token, removing from user:', fcmToken);
        // Optionally remove invalid token from database
      } else {
        console.error('Failed to send push notification:', error);
      }
    }
  }

  async sendOrderStatusNotification(userId: string, orderId: string, status: string): Promise<void> {
    try {
      // Fetch user preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          fcmToken: true,
          notificationPrefsOrderUpdates: true,
        },
      });

      // Skip if user disabled order updates notifications
      if (!user?.notificationPrefsOrderUpdates) {
        console.log(`Order update notifications disabled for user ${userId}`);
        return;
      }

      // Create notification record in database
      const titleMap: { [key: string]: string } = {
        PENDING: 'Order Confirmed',
        CONFIRMED: 'Order Confirmed',
        PREPARING: 'Order Being Prepared',
        OUT_FOR_DELIVERY: 'Order Out for Delivery',
        DELIVERED: 'Order Delivered',
        CANCELLED: 'Order Cancelled',
        REFUNDED: 'Payment Refunded',
      };

      const bodyMap: { [key: string]: string } = {
        PENDING: 'Your order has been received and is being processed',
        CONFIRMED: 'Your order has been confirmed',
        PREPARING: 'Your order is being prepared',
        OUT_FOR_DELIVERY: 'Your order is on its way',
        DELIVERED: 'Your order has been delivered. Thank you for your purchase!',
        CANCELLED: 'Your order has been cancelled',
        REFUNDED: 'Your payment has been refunded',
      };

      const notification = await prisma.notification.create({
        data: {
          userId,
          title: titleMap[status] || 'Order Update',
          body: bodyMap[status] || 'Your order status has been updated',
          type: 'ORDER_UPDATE',
          data: { orderId },
          isRead: false,
        },
      });

      // Send push notification if user has FCM token
      if (user?.fcmToken) {
        await this.sendPushNotification(
          user.fcmToken,
          notification.title,
          notification.body,
          { orderId, type: 'ORDER_UPDATE' }
        );
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Don't throw - notification failures should not break order updates
    }
  }

  async sendPromotionalNotification(
    userId: string,
    title: string,
    body: string,
    data?: { [key: string]: any }
  ): Promise<void> {
    try {
      // Fetch user preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          fcmToken: true,
          notificationPrefsPromotions: true,
        },
      });

      // Skip if user disabled promotional notifications
      if (!user?.notificationPrefsPromotions) {
        console.log(`Promotional notifications disabled for user ${userId}`);
        return;
      }

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          body,
          type: 'PROMOTION',
          data: data || {},
          isRead: false,
        },
      });

      // Send push notification if user has FCM token
      if (user?.fcmToken) {
        await this.sendPushNotification(
          user.fcmToken,
          title,
          body,
          { type: 'PROMOTION', ...data }
        );
      }
    } catch (error) {
      console.error('Failed to send promotional notification:', error);
    }
  }

  async getUserNotifications(
    userId: string,
    filters?: {
      page?: number;
      pageSize?: number;
      unreadOnly?: boolean;
    }
  ): Promise<{
    notifications: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { page = 1, pageSize = 10, unreadOnly = false } = filters || {};
    const skip = (page - 1) * pageSize;

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page,
      pageSize,
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async getNotificationPreferences(userId: string): Promise<{
    notificationPrefsOrderUpdates: boolean;
    notificationPrefsPromotions: boolean;
    notificationPrefsReviews: boolean;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        notificationPrefsOrderUpdates: true,
        notificationPrefsPromotions: true,
        notificationPrefsReviews: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: {
      orderUpdates?: boolean;
      promotions?: boolean;
      reviews?: boolean;
    }
  ): Promise<{
    orderUpdates: boolean;
    promotions: boolean;
    reviews: boolean;
  }> {
    const updateData: any = {};
    if (preferences.orderUpdates !== undefined) {
      updateData.notificationPrefsOrderUpdates = preferences.orderUpdates;
    }
    if (preferences.promotions !== undefined) {
      updateData.notificationPrefsPromotions = preferences.promotions;
    }
    if (preferences.reviews !== undefined) {
      updateData.notificationPrefsReviews = preferences.reviews;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        notificationPrefsOrderUpdates: true,
        notificationPrefsPromotions: true,
        notificationPrefsReviews: true,
      },
    });

    return {
      orderUpdates: user.notificationPrefsOrderUpdates,
      promotions: user.notificationPrefsPromotions,
      reviews: user.notificationPrefsReviews,
    };
  }
}

export const notificationService = new NotificationService();

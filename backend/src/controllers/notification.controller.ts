import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 10,
      unreadOnly: req.query.unreadOnly === 'true',
    };

    const result = await notificationService.getUserNotifications(userId, filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    await notificationService.markAsRead(userId, id);
    res.status(204).send();
  } catch (error: any) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    await notificationService.markAllAsRead(userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    
    // Load preferences from database
    const user = await notificationService.getNotificationPreferences(userId);
    
    res.json({
      orderUpdates: user.notificationPrefsOrderUpdates,
      promotions: user.notificationPrefsPromotions,
      reviews: user.notificationPrefsReviews,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
};

export const updateNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { orderUpdates, promotions, reviews } = req.body;

    // Save preferences to database
    const preferences = await notificationService.updateNotificationPreferences(userId, {
      orderUpdates,
      promotions,
      reviews,
    });

    res.json(preferences);
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to update notification preferences' });
  }
};

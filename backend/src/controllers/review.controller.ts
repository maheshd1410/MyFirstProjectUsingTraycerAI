import { Request, Response } from 'express';
import { reviewService } from '../services/review.service';
import { CreateReviewDTO, UpdateReviewDTO, ModerateReviewDTO } from '../types';

export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const data: CreateReviewDTO = req.body;
    const review = await reviewService.createReview(userId, data);
    res.status(201).json(review);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const data: UpdateReviewDTO = req.body;
    const review = await reviewService.updateReview(userId, id, data);
    res.json(review);
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('permission')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    await reviewService.deleteReview(userId, id);
    res.status(204).send();
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('permission')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
};

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 10,
      sortBy: (req.query.sortBy as any) || 'newest',
    };

    const result = await reviewService.getReviewsByProduct(productId, filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export const getUserReviews = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const reviews = await reviewService.getReviewsByUser(userId);
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export const moderateReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: ModerateReviewDTO = req.body;
    const review = await reviewService.moderateReview(id, data);
    res.json(review);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
};

export const getPendingReviews = async (req: Request, res: Response) => {
  try {
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 10,
    };

    const result = await reviewService.getPendingReviews(filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch pending reviews' });
  }
};

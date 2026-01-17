import { Request, Response } from 'express';
import { wishlistService } from '../services/wishlist.service';
import { WishlistResponse } from '../types';

export const getWishlist = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const wishlist: WishlistResponse = await wishlistService.getWishlist(userId);

    return res.status(200).json(wishlist);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch wishlist';
    return res.status(500).json({ error: message });
  }
};

export const addToWishlist = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Missing required field: productId' });
    }

    const wishlist: WishlistResponse = await wishlistService.addToWishlist(userId, productId);

    return res.status(200).json(wishlist);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add to wishlist';
    let statusCode = 400;
    if (message.includes('not found')) {
      statusCode = 404;
    } else if (message.includes('Unauthorized')) {
      statusCode = 403;
    }
    return res.status(statusCode).json({ error: message });
  }
};

export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const { productId } = req.params;

    const wishlist: WishlistResponse = await wishlistService.removeFromWishlist(userId, productId);

    return res.status(200).json(wishlist);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove from wishlist';
    let statusCode = 400;
    if (message.includes('not found')) {
      statusCode = 404;
    } else if (message.includes('Unauthorized')) {
      statusCode = 403;
    }
    return res.status(statusCode).json({ error: message });
  }
};

export const checkWishlistStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: 'Missing required field: productId' });
    }

    const status = await wishlistService.isInWishlist(userId, productId);

    return res.status(200).json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check wishlist status';
    return res.status(500).json({ error: message });
  }
};

export const clearWishlist = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    await wishlistService.clearWishlist(userId);

    return res.status(200).json({ message: 'Wishlist cleared successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to clear wishlist';
    return res.status(500).json({ error: message });
  }
};

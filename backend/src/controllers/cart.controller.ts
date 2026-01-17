import { Request, Response } from 'express';
import { cartService } from '../services/cart.service';
import { CartResponse } from '../types';

/**
 * Get user's cart with all items
 * GET /api/cart
 */
export const getCart = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const cart: CartResponse = await cartService.getCart(userId);

    return res.status(200).json(cart);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch cart';
    return res.status(500).json({ error: message });
  }
};

/**
 * Add item to cart
 * POST /api/cart/items
 */
export const addItemToCart = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    // Validate request body
    if (!productId || quantity === undefined) {
      return res.status(400).json({ error: 'Missing required fields: productId, quantity' });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    const cart: CartResponse = await cartService.addItem(userId, productId, quantity);

    return res.status(200).json(cart);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add item to cart';
    const statusCode = message.includes('not found') ? 404 : 400;
    return res.status(statusCode).json({ error: message });
  }
};

/**
 * Update cart item quantity
 * PUT /api/cart/items/:id
 */
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const itemId = req.params.id;
    const { quantity } = req.body;

    // Validate request body
    if (quantity === undefined) {
      return res.status(400).json({ error: 'Missing required field: quantity' });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    const cart: CartResponse = await cartService.updateItem(userId, itemId, quantity);

    return res.status(200).json(cart);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update cart item';
    let statusCode = 400;
    if (message.includes('not found')) {
      statusCode = 404;
    } else if (message.includes('Unauthorized')) {
      statusCode = 403;
    }
    return res.status(statusCode).json({ error: message });
  }
};

/**
 * Remove item from cart
 * DELETE /api/cart/items/:id
 */
export const removeCartItem = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const itemId = req.params.id;

    const cart: CartResponse = await cartService.removeItem(userId, itemId);

    return res.status(200).json(cart);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove cart item';
    let statusCode = 400;
    if (message.includes('not found')) {
      statusCode = 404;
    } else if (message.includes('Unauthorized')) {
      statusCode = 403;
    }
    return res.status(statusCode).json({ error: message });
  }
};

/**
 * Clear entire cart
 * DELETE /api/cart
 */
export const clearCart = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    await cartService.clearCart(userId);

    return res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to clear cart';
    return res.status(500).json({ error: message });
  }
};

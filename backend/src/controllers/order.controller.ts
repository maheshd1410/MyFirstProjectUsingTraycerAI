import { Request, Response } from 'express';
import { orderService } from '../services/order.service';
import { CreateOrderDTO, OrderResponse } from '../types';

/**
 * Create a new order from user's cart
 * POST /api/orders
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const { addressId, paymentMethod, specialInstructions } = req.body;

    // Validate required fields
    if (!addressId || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields: addressId, paymentMethod' });
    }

    // Validate addressId is a non-empty string
    if (typeof addressId !== 'string' || addressId.trim() === '') {
      return res.status(400).json({ error: 'addressId must be a non-empty string' });
    }

    // Validate paymentMethod
    const validPaymentMethods = ['CARD', 'UPI', 'COD', 'WALLET'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        error: `Invalid paymentMethod. Must be one of: ${validPaymentMethods.join(', ')}`,
      });
    }

    // Validate specialInstructions if provided
    if (specialInstructions !== undefined && typeof specialInstructions !== 'string') {
      return res.status(400).json({ error: 'specialInstructions must be a string' });
    }

    const createOrderData: CreateOrderDTO = {
      addressId,
      paymentMethod: paymentMethod as 'CARD' | 'UPI' | 'COD' | 'WALLET',
      specialInstructions,
    };

    const order: OrderResponse = await orderService.createOrder(userId, createOrderData);

    return res.status(201).json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create order';
    let statusCode = 500;

    if (message.includes('not found') || message.includes('does not belong')) {
      statusCode = 404;
    } else if (message.includes('empty')) {
      statusCode = 404;
    } else if (message.includes('Invalid')) {
      statusCode = 400;
    }

    return res.status(statusCode).json({ error: message });
  }
};

/**
 * Get user's orders with optional filters
 * GET /api/orders
 */
export const getOrders = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    let { page, pageSize, status } = req.query;

    // Parse and validate pagination parameters
    let pageNum = 1;
    let pageSizeNum = 10;

    if (page) {
      pageNum = parseInt(page as string, 10);
      if (!Number.isInteger(pageNum) || pageNum < 1) {
        return res.status(400).json({ error: 'page must be a positive integer' });
      }
    }

    if (pageSize) {
      pageSizeNum = parseInt(pageSize as string, 10);
      if (!Number.isInteger(pageSizeNum) || pageSizeNum < 1) {
        return res.status(400).json({ error: 'pageSize must be a positive integer' });
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
      if (!validStatuses.includes(status as string)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }
    }

    const filters = {
      page: pageNum,
      pageSize: pageSizeNum,
      status: status as string | undefined,
    };

    const result = await orderService.getOrders(userId, filters);

    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    return res.status(500).json({ error: message });
  }
};

/**
 * Get single order by ID
 * GET /api/orders/:id
 */
export const getOrderById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const orderId = req.params.id;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const order: OrderResponse = await orderService.getOrderById(userId, orderId);

    return res.status(200).json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch order';
    let statusCode = 500;

    if (message.includes('not found')) {
      statusCode = 404;
    } else if (message.includes('does not belong') || message.includes('Unauthorized')) {
      statusCode = 403;
    }

    return res.status(statusCode).json({ error: message });
  }
};

/**
 * Update order status (admin only)
 * PUT /api/orders/:id/status
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    // Validate orderId
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Validate status is provided
    if (!status) {
      return res.status(400).json({ error: 'Missing required field: status' });
    }

    // Validate status value
    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updatedOrder: OrderResponse = await orderService.updateOrderStatus(orderId, status);

    return res.status(200).json(updatedOrder);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update order status';
    let statusCode = 500;

    if (message.includes('Invalid status transition')) {
      statusCode = 400;
    } else if (message.includes('not found')) {
      statusCode = 404;
    }

    return res.status(statusCode).json({ error: message });
  }
};

/**
 * Cancel order (user can cancel their own orders)
 * DELETE /api/orders/:id
 */
export const cancelOrder = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const orderId = req.params.id;
    const { cancellationReason } = req.body;

    // Validate orderId
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Validate cancellationReason is provided
    if (!cancellationReason) {
      return res.status(400).json({ error: 'Missing required field: cancellationReason' });
    }

    // Validate cancellationReason is non-empty string
    if (typeof cancellationReason !== 'string' || cancellationReason.trim() === '') {
      return res.status(400).json({ error: 'cancellationReason must be a non-empty string' });
    }

    // Validate minimum length for meaningful reason
    if (cancellationReason.trim().length < 10) {
      return res.status(400).json({ error: 'cancellationReason must be at least 10 characters' });
    }

    const cancelledOrder: OrderResponse = await orderService.cancelOrder(
      userId,
      orderId,
      cancellationReason
    );

    return res.status(200).json(cancelledOrder);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cancel order';
    let statusCode = 500;

    if (message.includes('Cannot cancel')) {
      statusCode = 400;
    } else if (message.includes('not found')) {
      statusCode = 404;
    }

    return res.status(statusCode).json({ error: message });
  }
};

import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { prisma } from '../config/database';

/**
 * Create a payment intent for an order
 * POST /api/payment/create-payment-intent
 */
export const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const { orderId } = req.body;

    // Validate orderId is provided and non-empty string
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid required field: orderId' });
    }

    const paymentIntent = await paymentService.createPaymentIntent(orderId, userId);

    return res.status(201).json(paymentIntent);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create payment intent';
    let statusCode = 500;

    if (message.includes('not found')) {
      statusCode = 404;
    } else if (message.includes('already completed')) {
      statusCode = 400;
    }

    return res.status(statusCode).json({ error: message });
  }
};

/**
 * Handle Stripe webhook events
 * POST /api/payment/webhook
 */
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    // Extract raw body (must be Buffer)
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // req.body should be raw buffer from express.raw() middleware
    const payload = req.body;

    await paymentService.handleWebhook(payload, signature);

    return res.status(200).json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed';

    if (message.includes('Invalid signature')) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    console.error('Webhook error:', message);
    return res.status(400).json({ error: message });
  }
};

/**
 * Get payment by order ID
 * GET /api/payment/order/:orderId
 */
export const getPaymentByOrder = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.userId;
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing required parameter: orderId' });
    }

    // Verify order belongs to user
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      return res.status(403).json({ error: 'Forbidden - order does not belong to user' });
    }

    const payment = await paymentService.getPaymentByOrderId(orderId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    return res.status(200).json(payment);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch payment';
    return res.status(500).json({ error: message });
  }
};

/**
 * Refund a payment (Admin only)
 * POST /api/payment/:id/refund
 */
export const refundPayment = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: paymentId } = req.params;
    const { amount } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Missing required parameter: id' });
    }

    // Validate amount if provided
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }
    }

    const updatedPayment = await paymentService.processRefund(paymentId, amount);

    return res.status(200).json(updatedPayment);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process refund';
    let statusCode = 500;

    if (message.includes('not found')) {
      statusCode = 404;
    } else if (message.includes('Cannot refund')) {
      statusCode = 400;
    }

    return res.status(statusCode).json({ error: message });
  }
};

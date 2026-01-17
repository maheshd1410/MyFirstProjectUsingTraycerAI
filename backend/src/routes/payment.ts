import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';

const router = Router();

/**
 * @swagger
 * /api/payment/create-payment-intent:
 *   post:
 *     summary: Create a Stripe payment intent for an order
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Payment intent created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientSecret:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/create-payment-intent', csrfProtection, authenticate, paymentController.createPaymentIntent);

/**
 * @swagger
 * /api/payment/webhook:
 *   post:
 *     summary: Handle Stripe webhook events
 *     tags: [Payment]
 *     description: Webhook endpoint for Stripe payment events (no auth required, uses webhook signature)
 *     responses:
 *       200:
 *         description: Webhook processed
 *       400:
 *         description: Invalid webhook signature
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/webhook', paymentController.handleWebhook);

/**
 * @swagger
 * /api/payment/order/{orderId}:
 *   get:
 *     summary: Get payment details by order ID
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Payment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 orderId:
 *                   type: string
 *                 amount:
 *                   type: string
 *                 status:
 *                   type: string
 *                 paymentMethod:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/order/:orderId', authenticate, paymentController.getPaymentByOrder);

/**
 * @swagger
 * /api/payment/{id}/refund:
 *   post:
 *     summary: Refund a payment (Admin only)
 *     tags: [Payment]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment refunded
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/refund', csrfProtection, authenticate, requireRole('ADMIN'), paymentController.refundPayment);

export default router;

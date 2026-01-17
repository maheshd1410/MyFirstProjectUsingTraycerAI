import { prisma } from '../config/database';
import { stripe, STRIPE_WEBHOOK_SECRET } from '../config/stripe';
import logger from '../config/logger';
import { PaymentResponse, CreatePaymentIntentDTO, PaymentIntentResponse } from '../types';
import { Decimal } from '@prisma/client/runtime/library';

export class PaymentService {
  /**
   * Create a Stripe payment intent for an order
   */
  async createPaymentIntent(orderId: string, userId: string): Promise<PaymentIntentResponse> {
    // Verify order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Check order payment status is PENDING
    if (order.paymentStatus !== 'PENDING') {
      throw new Error('Order payment already completed');
    }

    // Convert amount to smallest currency unit (paise for INR)
    // Stripe expects amount in cents/smallest unit
    const amount = Math.round(order.totalAmount.toNumber() * 100);

    try {
      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'inr',
        metadata: {
          orderId,
          userId,
        },
      });

      // Create Payment record in database
      const payment = await prisma.payment.create({
        data: {
          orderId,
          stripePaymentIntentId: paymentIntent.id,
          amount: order.totalAmount,
          currency: 'INR',
          status: 'PENDING',
        },
      });

      return {
        clientSecret: paymentIntent.client_secret || '',
        paymentIntentId: paymentIntent.id,
        amount,
        currency: 'INR',
        status: paymentIntent.status,
      };
    } catch (error) {
      throw new Error(
        `Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Confirm payment after Stripe webhook notification
   */
  async confirmPayment(paymentIntentId: string): Promise<PaymentResponse> {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Find Payment record by stripePaymentIntentId
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: { order: true },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Use Prisma transaction for atomic updates
    const updatedPayment = await prisma.$transaction(async (tx) => {
      // Update Payment status to COMPLETED
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          transactionId: paymentIntent.id,
        },
      });

      // Update Order paymentStatus to COMPLETED
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: 'COMPLETED',
          status: 'CONFIRMED',
        },
      });

      return updated;
    });

    return this.formatPaymentResponse(updatedPayment);
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    try {
      // Verify webhook signature
      if (!STRIPE_WEBHOOK_SECRET) {
        throw new Error('Stripe webhook secret not configured');
      }

      const event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);

      logger.info('Processing Stripe webhook', { eventType: event.type, eventId: event.id });

      // Use Prisma transaction for atomic updates
      await prisma.$transaction(async (tx) => {
        switch (event.type) {
          case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as any;
            const payment = await tx.payment.findUnique({
              where: { stripePaymentIntentId: paymentIntent.id },
            });

            if (!payment) {
              throw new Error(`Payment not found for payment intent ${paymentIntent.id}`);
            }

            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: 'COMPLETED',
                transactionId: paymentIntent.charges?.data[0]?.id || null,
              },
            });

            await tx.order.update({
              where: { id: payment.orderId },
              data: {
                paymentStatus: 'COMPLETED',
                status: 'CONFIRMED',
              },
            });

            logger.info('Payment confirmed', { 
              paymentIntentId: paymentIntent.id, 
              orderId: payment.orderId,
              amount: paymentIntent.amount / 100
            });
            break;
          }

          case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object as any;
            const payment = await tx.payment.findUnique({
              where: { stripePaymentIntentId: paymentIntent.id },
            });

            if (!payment) {
              throw new Error(`Payment not found for payment intent ${paymentIntent.id}`);
            }

            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: 'FAILED',
                failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
              },
            });

            await tx.order.update({
              where: { id: payment.orderId },
              data: {
                paymentStatus: 'FAILED',
              },
            });

            logger.warn('Payment failed', { 
              paymentIntentId: paymentIntent.id, 
              orderId: payment.orderId,
              reason: paymentIntent.last_payment_error?.message || 'Unknown'
            });
            break;
          }

          case 'charge.refunded': {
            const charge = event.data.object as any;
            const payment = await tx.payment.findFirst({
              where: {
                transactionId: charge.id,
              },
            });

            if (payment && charge.refunded) {
              // Use cumulative amount_refunded from Stripe
              const totalRefundedAmount = new Decimal(charge.amount_refunded).div(100);
              const paymentAmount = payment.amount;

              // Check if full refund
              const isFullRefund = totalRefundedAmount.equals(paymentAmount);

              await tx.payment.update({
                where: { id: payment.id },
                data: {
                  status: isFullRefund ? 'REFUNDED' : 'COMPLETED',
                  refundedAmount: totalRefundedAmount,
                },
              });

              if (isFullRefund) {
                await tx.order.update({
                  where: { id: payment.orderId },
                  data: {
                    paymentStatus: 'REFUNDED',
                    status: 'REFUNDED',
                  },
                });
              }

              logger.info('Refund processed', { 
                paymentId: payment.id,
                amount: charge.amount_refunded / 100 
              });
            }
            break;
          }

          default:
            logger.debug('Unhandled webhook event', { eventType: event.type });
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Webhook processing error', { error: message, signature });
      throw error;
    }
  }

  /**
   * Process refund for a payment
   */
  async processRefund(paymentId: string, amount?: number): Promise<PaymentResponse> {
    // Find Payment record by ID
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Verify payment status is COMPLETED
    if (payment.status !== 'COMPLETED') {
      throw new Error(`Cannot refund payment with status ${payment.status}`);
    }

    try {
      // Calculate already refunded and remaining amount
      const alreadyRefunded = payment.refundedAmount ? payment.refundedAmount.toNumber() : 0;
      const remaining = payment.amount.toNumber() - alreadyRefunded;
      const requestedAmount = amount || payment.amount.toNumber();

      // Reject refunds exceeding remaining balance
      if (requestedAmount > remaining) {
        throw new Error(
          `Refund amount ${requestedAmount} exceeds remaining refundable amount ${remaining}`
        );
      }

      // Create Stripe refund with validated amount
      const refundAmount = Math.round(requestedAmount * 100);

      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId || undefined,
        amount: refundAmount,
      });

      // Calculate new total refunded amount by adding to already refunded
      const newRefundAmount = new Decimal(refund.amount).div(100);
      const totalRefundedAmount = new Decimal(alreadyRefunded).add(newRefundAmount);
      const paymentAmount = payment.amount;

      // Check if this results in a full refund
      const isFullRefund = totalRefundedAmount.equals(paymentAmount);

      const updatedPayment = await prisma.$transaction(async (tx) => {
        const updated = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: isFullRefund ? 'REFUNDED' : 'COMPLETED',
            refundedAmount: totalRefundedAmount,
          },
        });

        // Update Order paymentStatus and status if full refund
        if (isFullRefund) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: {
              paymentStatus: 'REFUNDED',
              status: 'REFUNDED',
            },
          });
        }

        return updated;
      });

      return this.formatPaymentResponse(updatedPayment);
    } catch (error) {
      throw new Error(
        `Refund processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: string): Promise<PaymentResponse | null> {
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      return null;
    }

    return this.formatPaymentResponse(payment);
  }

  /**
   * Format Payment record to PaymentResponse DTO
   */
  private formatPaymentResponse(payment: any): PaymentResponse {
    return {
      id: payment.id,
      orderId: payment.orderId,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      amount: payment.amount.toString(),
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      failureReason: payment.failureReason,
      refundedAmount: payment.refundedAmount?.toString() || null,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

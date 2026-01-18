import { prisma } from '../config/database';
import { cartService } from './cart.service';
import { notificationService } from './notification.service';
import { couponService } from './coupon.service';
import { CreateOrderDTO, UpdateOrderStatusDTO, CancelOrderDTO, OrderResponse, OrderItemResponse } from '../types';
import { Decimal } from '@prisma/client/runtime/library';
import { emailService } from './email.service';
import logger from '../config/logger';

export class OrderService {
  /**
   * Generate unique order number with format ORD-YYYYMMDD-XXXXX
   */
  private async generateOrderNumber(): Promise<string> {
    const maxRetries = 5;
    for (let i = 0; i < maxRetries; i++) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomStr = Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, '0');
      const orderNumber = `ORD-${dateStr}-${randomStr}`;

      const exists = await prisma.order.findUnique({
        where: { orderNumber },
      });

      if (!exists) {
        return orderNumber;
      }
    }

    throw new Error('Failed to generate unique order number after multiple retries');
  }

  /**
   * Calculate order amounts: subtotal, tax, delivery, discount, total
   */
  private async calculateOrderAmounts(
    cartTotal: Decimal,
    couponCode?: string,
    userId?: string,
    categoryIds?: string[],
    productIds?: string[]
  ): Promise<{
    subtotal: string;
    taxAmount: string;
    deliveryCharge: string;
    discountAmount: string;
    couponDiscount: string;
    totalAmount: string;
    couponId?: string;
  }> {
    const subtotal = cartTotal;
    const TAX_RATE = new Decimal('0.05'); // 5% GST
    const FREE_DELIVERY_THRESHOLD = new Decimal('500');
    const DELIVERY_CHARGE = new Decimal('50');

    let couponDiscount = new Decimal('0');
    let isFreeShipping = false;
    let couponId: string | undefined;

    // Apply coupon if provided
    if (couponCode && userId && categoryIds && productIds) {
      try {
        const couponResult = await couponService.applyCoupon(
          couponCode,
          userId,
          subtotal,
          categoryIds,
          productIds
        );
        if (couponResult.isValid) {
          couponDiscount = new Decimal(couponResult.discountAmount);
          couponId = couponResult.couponId;
          isFreeShipping = couponResult.isFreeShipping || false;
        }
      } catch (error) {
        logger.warn('Coupon validation failed during order creation', { couponCode, error });
        // Don't throw - allow order to proceed without coupon
      }
    }

    const subtotalAfterCoupon = subtotal.sub(couponDiscount);
    const taxAmount = subtotalAfterCoupon.mul(TAX_RATE);
    
    // Check for free shipping (from coupon or threshold)
    let deliveryCharge = isFreeShipping || subtotalAfterCoupon.greaterThanOrEqualTo(FREE_DELIVERY_THRESHOLD)
      ? new Decimal('0')
      : DELIVERY_CHARGE;

    const discountAmount = new Decimal('0'); // Keep for future product-level discounts
    const totalAmount = subtotalAfterCoupon.add(taxAmount).add(deliveryCharge).sub(discountAmount);

    return {
      subtotal: subtotal.toString(),
      taxAmount: taxAmount.toString(),
      deliveryCharge: deliveryCharge.toString(),
      discountAmount: discountAmount.toString(),
      couponDiscount: couponDiscount.toString(),
      totalAmount: totalAmount.toString(),
      couponId,
    };
  }

  /**
   * Create order from user's cart
   */
  async createOrder(userId: string, data: CreateOrderDTO): Promise<OrderResponse> {
    // Fetch user's cart
    const cart = await cartService.getCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Verify address exists and belongs to user
    const address = await prisma.address.findFirst({
      where: { id: data.addressId, userId },
    });
    if (!address) {
      throw new Error('Address not found or does not belong to user');
    }

    // Extract unique category and product IDs from cart items
    const categoryIds = [...new Set(cart.items.map(item => item.productId))];
    const productIds = cart.items.map(item => item.productId);

    // Calculate order amounts with coupon if provided
    const amounts = await this.calculateOrderAmounts(
      new Decimal(cart.totalAmount),
      data.couponCode,
      userId,
      categoryIds,
      productIds
    );

    // Generate unique order number
    const orderNumber = await this.generateOrderNumber();

    // Use transaction to create order and clear cart
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod: data.paymentMethod,
          subtotal: new Decimal(amounts.subtotal),
          taxAmount: new Decimal(amounts.taxAmount),
          deliveryCharge: new Decimal(amounts.deliveryCharge),
          discountAmount: new Decimal(amounts.discountAmount),
          couponDiscount: new Decimal(amounts.couponDiscount),
          couponId: amounts.couponId || null,
          couponCode: data.couponCode || null,
          totalAmount: new Decimal(amounts.totalAmount),
          specialInstructions: data.specialInstructions || null,
          addressId: data.addressId,
          estimatedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        },
        include: { 
          address: true,
          user: true,
        },
      });

      // Create order items from cart
      const variantIds = cart.items
        .map(item => item.variantId)
        .filter((id): id is string => id !== null && id !== undefined);
      
      // Fetch variants to get SKU
      const variants = variantIds.length > 0
        ? await tx.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: { id: true, sku: true },
          })
        : [];
      
      const variantSkuMap = new Map(variants.map(v => [v.id, v.sku]));

      const orderItems = await tx.orderItem.createMany({
        data: cart.items.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage || null,
          quantity: item.quantity,
          unitPrice: new Decimal(item.price),
          totalPrice: new Decimal(item.subtotal),
          variantId: item.variantId || null,
          variantSku: item.variantId ? variantSkuMap.get(item.variantId) || null : null,
          variantName: item.variantName || null,
          variantAttributes: item.variantAttributes ? JSON.parse(JSON.stringify(item.variantAttributes)) : undefined,
        })),
      });

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cart: { userId } },
      });

      return { newOrder, orderItems };
    });

    // Fetch complete order with items for email
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.newOrder.id },
      include: {
        user: true,
        address: true,
        items: true,
      },
    });

    // Send order confirmation email
    if (completeOrder) {
      try {
        await emailService.sendOrderConfirmationEmail(completeOrder);
        logger.info('Order confirmation email queued', { orderId: completeOrder.id });
      } catch (error) {
        logger.error('Failed to queue order confirmation', { orderId: completeOrder.id, error });
      }
    }

    // Record coupon usage if coupon was applied
    if (amounts.couponId && data.couponCode) {
      try {
        await couponService.incrementUsageCount(
          amounts.couponId,
          userId,
          order.newOrder.id,
          new Decimal(amounts.couponDiscount)
        );
      } catch (error) {
        logger.error('Failed to record coupon usage', { couponId: amounts.couponId, error });
        // Don't throw - order is already created successfully
      }
    }

    // Note: For CARD and UPI payments, the client will call POST /api/payment/create-payment-intent
    // For COD and WALLET, payment status remains PENDING until manual confirmation

    return this.formatOrderResponse(order.newOrder, order.newOrder.address, 
      cart.items.map((item) => ({
        id: '', // Will be populated from actual DB items
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.subtotal,
      }))
    );
  }

  /**
   * Get user's orders with pagination and optional status filter
   */
  async getOrders(
    userId: string,
    filters?: { page?: number; pageSize?: number; status?: string }
  ): Promise<{
    orders: OrderResponse[];
    pagination: {
      currentPage: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  }> {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: any = { userId };
    if (filters?.status) {
      where.status = filters.status;
    }

    // Count total items matching the filter
    const totalItems = await prisma.order.count({ where });
    const totalPages = Math.ceil(totalItems / pageSize);

    const orders = await prisma.order.findMany({
      where,
      include: { address: true, items: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    return {
      orders: orders.map((order) => this.formatOrderResponse(order, order.address, order.items)),
      pagination: {
        currentPage: page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  }

  /**
   * Get single order by ID with ownership verification
   */
  async getOrderById(userId: string, orderId: string): Promise<OrderResponse> {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { address: true, items: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return this.formatOrderResponse(order, order.address, order.items);
  }

  /**
   * Update order status with validation
   */
  async updateOrderStatus(orderId: string, newStatus: string): Promise<OrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { address: true, items: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['OUT_FOR_DELIVERY'],
      OUT_FOR_DELIVERY: ['DELIVERED'],
      DELIVERED: ['REFUNDED'],
      CANCELLED: [],
      REFUNDED: [],
    };

    if (!validTransitions[order.status]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
    }

    // Update order status
    const updateData: any = { status: newStatus };
    if (newStatus === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }
    if (newStatus === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { 
        address: true, 
        items: true,
        user: true,
      },
    });

    // Send push notification after successful update
    try {
      await notificationService.sendOrderStatusNotification(updatedOrder.userId, orderId, newStatus);
    } catch (error) {
      logger.error('Failed to send order status notification:', { orderId, error });
      // Don't fail the order update if notification fails
    }

    // Send email notifications
    try {
      await emailService.sendOrderStatusUpdateEmail(updatedOrder, newStatus);
      if (newStatus === 'DELIVERED') {
        await emailService.sendOrderDeliveredEmail(updatedOrder);
      }
      logger.info('Order status email queued', { orderId });
    } catch (error) {
      logger.error('Failed to queue status email', { orderId, error });
    }

    return this.formatOrderResponse(updatedOrder, updatedOrder.address, updatedOrder.items);
  }

  /**
   * Cancel order with reason
   */
  async cancelOrder(userId: string, orderId: string, reason: string): Promise<OrderResponse> {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { address: true, items: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Validate cancellation is allowed
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new Error(`Cannot cancel order with status ${order.status}`);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
      include: { 
        address: true, 
        items: true,
        user: true,
      },
    });

    // Send push notification after successful cancellation
    try {
      await notificationService.sendOrderStatusNotification(updatedOrder.userId, orderId, 'CANCELLED');
    } catch (error) {
      logger.error('Failed to send order cancellation notification:', { orderId, error });
      // Don't fail the order cancellation if notification fails
    }

    // Send cancellation email
    try {
      await emailService.sendOrderCancelledEmail(updatedOrder, reason);
      logger.info('Cancellation email queued', { orderId });
    } catch (error) {
      logger.error('Failed to queue cancellation email', { orderId, error });
    }

    return this.formatOrderResponse(updatedOrder, updatedOrder.address, updatedOrder.items);
  }

  /**
   * Format Prisma order object to OrderResponse
   */
  private formatOrderResponse(
    order: any,
    address: any,
    items: any[]
  ): OrderResponse {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal.toString(),
      taxAmount: order.taxAmount.toString(),
      deliveryCharge: order.deliveryCharge.toString(),
      discountAmount: order.discountAmount.toString(),
      couponDiscount: order.couponDiscount?.toString() || '0',
      couponCode: order.couponCode,
      couponId: order.couponId,
      totalAmount: order.totalAmount.toString(),
      specialInstructions: order.specialInstructions,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      cancellationReason: order.cancellationReason,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      address: {
        id: address.id,
        userId: address.userId,
        fullName: address.fullName,
        phoneNumber: address.phoneNumber,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        isDefault: address.isDefault,
        createdAt: address.createdAt,
        updatedAt: address.updatedAt,
      },
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        totalPrice: item.totalPrice.toString(),
        variantId: item.variantId,
        variantSku: item.variantSku,
        variantName: item.variantName,
        variantAttributes: item.variantAttributes,
      })),
    };
  }
}

export const orderService = new OrderService();

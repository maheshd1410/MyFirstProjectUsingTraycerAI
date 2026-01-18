// @ts-nocheck
import { OrderService } from '../../src/services/order.service';
import { prismaMock } from '../mocks/prisma.mock';
import { createMockUser, createMockAddress, createMockProduct, createMockOrder } from '../helpers/test-data';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Mock dependencies - must be before imports that use them
jest.mock('../../src/services/cart.service', () => ({
  cartService: {
    getCart: jest.fn(),
  },
}));

jest.mock('../../src/services/notification.service', () => ({
  notificationService: {
    sendOrderStatusNotification: jest.fn(),
    sendOrderCancellation: jest.fn(),
  },
}));

import { cartService } from '../../src/services/cart.service';
import { notificationService } from '../../src/services/notification.service';

// Helper to create order with address relation
const createMockOrderWithAddress = (orderOverrides?: any, addressOverrides?: any) => {
  const address = createMockAddress(addressOverrides);
  const order = createMockOrder(orderOverrides);
  return { ...order, address, items: [] };
};

describe('OrderService', () => {
  let orderService: OrderService;

  beforeEach(() => {
    orderService = new OrderService();
    jest.clearAllMocks();
  });

  describe('createOrder()', () => {
    const userId = 'user-1';
    const addressId = 'address-1';
    const mockUser = createMockUser({ id: userId });
    const mockAddress = createMockAddress({ id: addressId, userId });
    const mockProduct = createMockProduct({ id: 'product-1', price: new Decimal('100.00') });

    it('should successfully create order from cart', async () => {
      const mockCart = {
        id: 'cart-1',
        userId,
        totalAmount: '200.00',
        items: [
          {
            id: 'cart-item-1',
            productId: mockProduct.id,
            productName: 'Test Product',
            productImage: 'https://example.com/image.jpg',
            price: '100.00',
            quantity: 2,
            subtotal: '200.00',
          },
        ],
      };

      cartService.getCart.mockResolvedValue(mockCart as any);
      prismaMock.address.findFirst.mockResolvedValue(mockAddress);
      
      const mockOrder = createMockOrder({
        id: 'order-1',
        userId,
        addressId,
        subtotal: new Decimal('200.00'),
        taxAmount: new Decimal('10.00'),
        deliveryCharge: new Decimal('50.00'),
        discountAmount: new Decimal('0.00'),
        totalAmount: new Decimal('260.00'),
      });

      prismaMock.$transaction.mockImplementation(async (txFn: any) => {
        return txFn(prismaMock);
      });

      prismaMock.order.create.mockResolvedValue({ ...mockOrder, address: mockAddress } as any);
      prismaMock.orderItem.createMany.mockResolvedValue({ count: 1 });
      prismaMock.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      const result = await orderService.createOrder(userId, { addressId, paymentMethod: PaymentMethod.COD });

      expect(cartService.getCart).toHaveBeenCalledWith(userId);
      expect(prismaMock.address.findFirst).toHaveBeenCalledWith({
        where: { id: addressId, userId },
      });
      expect(prismaMock.order.create).toHaveBeenCalled();
      expect(parseFloat(result.subtotal)).toBeCloseTo(parseFloat('200.00'), 2);
      expect(parseFloat(result.totalAmount)).toBeCloseTo(parseFloat('260.00'), 2);
    });

    it('should throw error when cart is empty', async () => {
      const emptyCart = {
        id: 'cart-1',
        userId,
        totalAmount: '0',
        items: [],
      };

      cartService.getCart.mockResolvedValue(emptyCart as any);

      await expect(orderService.createOrder(userId, { addressId, paymentMethod: PaymentMethod.COD }))
        .rejects.toThrow('Cart is empty');
    });

    it('should throw error when address not found', async () => {
      const mockCart = {
        id: 'cart-1',
        userId,
        totalAmount: '100.00',
        items: [
          {
            id: 'cart-item-1',
            productId: mockProduct.id,
            productName: 'Test Product',
            productImage: 'https://example.com/image.jpg',
            price: '100.00',
            quantity: 1,
            subtotal: '100.00',
          },
        ],
      };

      cartService.getCart.mockResolvedValue(mockCart as any);
      prismaMock.address.findFirst.mockResolvedValue(null);

      await expect(orderService.createOrder(userId, { addressId, paymentMethod: PaymentMethod.COD }))
        .rejects.toThrow('Address not found');
    });

    it('should calculate order amounts correctly', async () => {
      const mockCart = {
        id: 'cart-1',
        userId,
        totalAmount: '300.00',
        items: [
          {
            id: 'cart-item-1',
            productId: mockProduct.id,
            productName: 'Test Product',
            productImage: 'https://example.com/image.jpg',
            price: '100.00',
            quantity: 3,
            subtotal: '300.00',
          },
        ],
      };

      cartService.getCart.mockResolvedValue(mockCart as any);
      prismaMock.address.findFirst.mockResolvedValue(mockAddress);

      prismaMock.$transaction.mockImplementation(async (txFn: any) => {
        return txFn(prismaMock);
      });

      const mockOrder = createMockOrder({
        subtotal: new Decimal('300.00'),
        taxAmount: new Decimal('15.00'),
        deliveryCharge: new Decimal('50.00'),
        discountAmount: new Decimal('0.00'),
        totalAmount: new Decimal('365.00'),
      });

      prismaMock.order.create.mockResolvedValue({ ...mockOrder, address: mockAddress } as any);
      prismaMock.orderItem.createMany.mockResolvedValue({ count: 1 });
      prismaMock.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      const result = await orderService.createOrder(userId, { addressId, paymentMethod: PaymentMethod.COD });

      expect(parseFloat(result.subtotal)).toBeCloseTo(parseFloat('300.00'), 2);
      expect(parseFloat(result.taxAmount)).toBeCloseTo(parseFloat('15.00'), 2);
      expect(parseFloat(result.deliveryCharge)).toBeCloseTo(parseFloat('50.00'), 2);
      expect(parseFloat(result.totalAmount)).toBeCloseTo(parseFloat('365.00'), 2);
    });

    it('should apply free delivery for orders >= 500', async () => {
      const mockCart = {
        id: 'cart-1',
        userId,
        totalAmount: '600.00',
        items: [
          {
            id: 'cart-item-1',
            productId: 'product-1',
            productName: 'Expensive Product',
            productImage: 'https://example.com/image.jpg',
            price: '600.00',
            quantity: 1,
            subtotal: '600.00',
          },
        ],
      };

      cartService.getCart.mockResolvedValue(mockCart as any);
      prismaMock.address.findFirst.mockResolvedValue(mockAddress);

      prismaMock.$transaction.mockImplementation(async (txFn: any) => {
        return txFn(prismaMock);
      });

      const mockOrder = createMockOrder({
        subtotal: new Decimal('600.00'),
        taxAmount: new Decimal('30.00'),
        deliveryCharge: new Decimal('0.00'),
        discountAmount: new Decimal('0.00'),
        totalAmount: new Decimal('630.00'),
      });

      prismaMock.order.create.mockResolvedValue({ ...mockOrder, address: mockAddress } as any);
      prismaMock.orderItem.createMany.mockResolvedValue({ count: 1 });
      prismaMock.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      const result = await orderService.createOrder(userId, { addressId, paymentMethod: PaymentMethod.COD });

      expect(parseFloat(result.deliveryCharge)).toBeCloseTo(parseFloat('0.00'), 2);
    });

    it('should generate order number with correct format', async () => {
      const mockCart = {
        id: 'cart-1',
        userId,
        totalAmount: '100.00',
        items: [
          {
            id: 'cart-item-1',
            productId: mockProduct.id,
            productName: 'Test Product',
            productImage: 'https://example.com/image.jpg',
            price: '100.00',
            quantity: 1,
            subtotal: '100.00',
          },
        ],
      };

      cartService.getCart.mockResolvedValue(mockCart as any);
      prismaMock.address.findFirst.mockResolvedValue(mockAddress);

      prismaMock.$transaction.mockImplementation(async (txFn: any) => {
        return txFn(prismaMock);
      });

      const mockOrder = createMockOrder({
        orderNumber: 'ORD-20260117-00001',
      });

      prismaMock.order.create.mockResolvedValue({ ...mockOrder, address: mockAddress } as any);
      prismaMock.orderItem.createMany.mockResolvedValue({ count: 1 });
      prismaMock.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      const result = await orderService.createOrder(userId, { addressId, paymentMethod: PaymentMethod.COD });

      expect(result.orderNumber).toMatch(/^ORD-\d{8}-\d{5}$/);
    });

    it('should set estimated delivery date to 5 days from now', async () => {
      const mockCart = {
        id: 'cart-1',
        userId,
        totalAmount: '100.00',
        items: [
          {
            id: 'cart-item-1',
            productId: mockProduct.id,
            productName: 'Test Product',
            productImage: 'https://example.com/image.jpg',
            price: '100.00',
            quantity: 1,
            subtotal: '100.00',
          },
        ],
      };

      cartService.getCart.mockResolvedValue(mockCart as any);
      prismaMock.address.findFirst.mockResolvedValue(mockAddress);

      prismaMock.$transaction.mockImplementation(async (txFn: any) => {
        return txFn(prismaMock);
      });

      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + 5);

      const mockOrder = createMockOrder({
        estimatedDeliveryDate: estimatedDate,
      });

      prismaMock.order.create.mockResolvedValue({ ...mockOrder, address: mockAddress } as any);
      prismaMock.orderItem.createMany.mockResolvedValue({ count: 1 });
      prismaMock.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      const result = await orderService.createOrder(userId, { addressId, paymentMethod: PaymentMethod.COD });

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 5);
      
      expect(result.estimatedDeliveryDate).toBeDefined();
      expect(result.estimatedDeliveryDate!.getDate()).toBe(expectedDate.getDate());
    });
  });

  describe('getOrders()', () => {
    const userId = 'user-1';

    it('should return paginated orders', async () => {
      const mockOrders = [
        createMockOrderWithAddress({ id: 'order-1', userId }),
        createMockOrderWithAddress({ id: 'order-2', userId }),
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders as any);
      prismaMock.order.count.mockResolvedValue(10);

      const result = await orderService.getOrders(userId, { page: 1, pageSize: 2 });

      expect(result.orders).toHaveLength(2);
      expect(result.pagination.totalItems).toBe(10);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.pageSize).toBe(2);
      expect(prismaMock.order.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { address: true, items: true },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 2,
      });
    });

    it('should filter by status', async () => {
      const mockOrders = [
        createMockOrderWithAddress({ id: 'order-1', userId, status: OrderStatus.PENDING }),
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders as any);
      prismaMock.order.count.mockResolvedValue(1);

      const result = await orderService.getOrders(userId, { 
        page: 1, 
        pageSize: 10, 
        status: OrderStatus.PENDING 
      });

      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { 
            userId,
            status: OrderStatus.PENDING,
          },
        })
      );
    });

    it('should calculate correct skip value for pagination', async () => {
      prismaMock.order.findMany.mockResolvedValue([]);
      prismaMock.order.count.mockResolvedValue(0);

      await orderService.getOrders(userId, { page: 3, pageSize: 10 });

      expect(prismaMock.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3-1) * 10
          take: 10,
        })
      );
    });
  });

  describe('getOrderById()', () => {
    const userId = 'user-1';
    const orderId = 'order-1';

    it('should return order with address and items', async () => {
      const mockOrder = createMockOrderWithAddress({ id: orderId, userId });
      prismaMock.order.findFirst.mockResolvedValue(mockOrder as any);

      const result = await orderService.getOrderById(userId, orderId);

      expect(result).toBeDefined();
      expect(prismaMock.order.findFirst).toHaveBeenCalledWith({
        where: { id: orderId, userId },
        include: { address: true, items: true },
      });
    });

    it('should throw error when order not found', async () => {
      prismaMock.order.findFirst.mockResolvedValue(null);

      await expect(orderService.getOrderById(userId, orderId))
        .rejects.toThrow('Order not found');
    });

  });

  describe('updateOrderStatus()', () => {
    const orderId = 'order-1';

    it('should update order status successfully', async () => {
      const mockOrder = createMockOrderWithAddress({ 
        id: orderId, 
        status: OrderStatus.PENDING 
      });
      
      const updatedOrder = createMockOrderWithAddress({ 
        id: orderId, 
        status: OrderStatus.CONFIRMED 
      });

      prismaMock.order.findUnique.mockResolvedValue(mockOrder);
      prismaMock.order.update.mockResolvedValue(updatedOrder as any);
      notificationService.sendOrderStatusNotification.mockResolvedValue(undefined);

      const result = await orderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED);

      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(prismaMock.order.update).toHaveBeenCalled();
      expect(notificationService.sendOrderStatusNotification).toHaveBeenCalledWith(
        mockOrder.userId,
        orderId,
        OrderStatus.CONFIRMED
      );
    });

    it('should set deliveredAt when status becomes DELIVERED', async () => {
      const mockOrder = createMockOrderWithAddress({ 
        id: orderId, 
        status: OrderStatus.OUT_FOR_DELIVERY 
      });

      const deliveredDate = new Date();
      const updatedOrder = createMockOrderWithAddress({ 
        id: orderId, 
        status: OrderStatus.DELIVERED,
        deliveredAt: deliveredDate,
      });

      prismaMock.order.findUnique.mockResolvedValue(mockOrder);
      prismaMock.order.update.mockResolvedValue(updatedOrder as any);
      notificationService.sendOrderStatusNotification.mockResolvedValue(undefined);

      const result = await orderService.updateOrderStatus(orderId, OrderStatus.DELIVERED);

      expect(result.deliveredAt).toBeDefined();
      expect(prismaMock.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deliveredAt: expect.any(Date),
          }),
        })
      );
    });

    it('should set cancelledAt when status becomes CANCELLED', async () => {
      const mockOrder = createMockOrderWithAddress({ 
        id: orderId, 
        status: OrderStatus.PENDING 
      });

      const cancelledDate = new Date();
      const updatedOrder = createMockOrderWithAddress({ 
        id: orderId, 
        status: OrderStatus.CANCELLED,
        cancelledAt: cancelledDate,
      });

      prismaMock.order.findUnique.mockResolvedValue(mockOrder);
      prismaMock.order.update.mockResolvedValue(updatedOrder as any);
      notificationService.sendOrderStatusNotification.mockResolvedValue(undefined);

      const result = await orderService.updateOrderStatus(orderId, OrderStatus.CANCELLED);

      expect(result.cancelledAt).toBeDefined();
    });

    it('should handle notification failure gracefully', async () => {
      const mockOrder = createMockOrderWithAddress({ 
        id: orderId, 
        status: OrderStatus.PENDING 
      });
      
      const updatedOrder = createMockOrderWithAddress({ 
        id: orderId, 
        status: OrderStatus.CONFIRMED 
      });

      prismaMock.order.findUnique.mockResolvedValue(mockOrder);
      prismaMock.order.update.mockResolvedValue(updatedOrder as any);
      notificationService.sendOrderStatusNotification.mockRejectedValue(
        new Error('Notification service unavailable')
      );

      // Should not throw error even if notification fails
      const result = await orderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED);

      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should throw error when order not found', async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      await expect(orderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED))
        .rejects.toThrow('Order not found');
    });
  });

  describe('cancelOrder()', () => {
    const orderId = 'order-1';
    const userId = 'user-1';
    const cancellationReason = 'Changed my mind';

    it('should cancel order from PENDING status', async () => {
      const mockOrder = createMockOrderWithAddress({ 
        id: orderId, 
        userId,
        status: OrderStatus.PENDING 
      });

      const cancelledOrder = createMockOrderWithAddress({ 
        id: orderId, 
        userId,
        status: OrderStatus.CANCELLED,
        cancellationReason,
        cancelledAt: new Date(),
      });

      prismaMock.order.findFirst.mockResolvedValue(mockOrder as any);
      prismaMock.order.update.mockResolvedValue(cancelledOrder);
      notificationService.sendOrderStatusNotification.mockResolvedValue(undefined);

      const result = await orderService.cancelOrder(userId, orderId, cancellationReason);

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(result.cancellationReason).toBe(cancellationReason);
      expect(result.cancelledAt).toBeDefined();
    });

    it('should cancel order from CONFIRMED status', async () => {
      const mockOrder = createMockOrderWithAddress({ 
        id: orderId, 
        userId,
        status: OrderStatus.CONFIRMED 
      });

      const cancelledOrder = createMockOrderWithAddress({ 
        id: orderId, 
        status: OrderStatus.CANCELLED 
      });

      prismaMock.order.findFirst.mockResolvedValue(mockOrder as any);
      prismaMock.order.update.mockResolvedValue(cancelledOrder);
      notificationService.sendOrderStatusNotification.mockResolvedValue(undefined);

      const result = await orderService.cancelOrder(userId, orderId, cancellationReason);

      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('should throw error when cancelling from PREPARING status', async () => {
      const mockOrder = createMockOrderWithAddress({ 
        id: orderId, 
        userId,
        status: OrderStatus.PREPARING 
      });

      prismaMock.order.findFirst.mockResolvedValue(mockOrder as any);

      await expect(orderService.cancelOrder(userId, orderId, cancellationReason))
        .rejects.toThrow('Cannot cancel order');
    });

    it('should throw error when cancelling from DELIVERED status', async () => {
      const mockOrder = createMockOrderWithAddress({ 
        id: orderId, 
        userId,
        status: OrderStatus.DELIVERED 
      });

      prismaMock.order.findFirst.mockResolvedValue(mockOrder as any);

      await expect(orderService.cancelOrder(userId, orderId, cancellationReason))
        .rejects.toThrow('Cannot cancel order');
    });

    it('should call notification service after cancellation', async () => {
      const mockOrder = createMockOrderWithAddress({ 
        id: orderId, 
        userId,
        status: OrderStatus.PENDING 
      });

      const cancelledOrder = createMockOrderWithAddress({ 
        id: orderId, 
        status: OrderStatus.CANCELLED 
      });

      prismaMock.order.findFirst.mockResolvedValue(mockOrder as any);
      prismaMock.order.update.mockResolvedValue(cancelledOrder);
      notificationService.sendOrderStatusNotification.mockResolvedValue(undefined);

      await orderService.cancelOrder(userId, orderId, cancellationReason);

      expect(notificationService.sendOrderStatusNotification).toHaveBeenCalled();
    });

    it('should throw error when order not found', async () => {
      prismaMock.order.findFirst.mockResolvedValue(null);

      await expect(orderService.cancelOrder(userId, orderId, cancellationReason))
        .rejects.toThrow('Order not found');
    });
  });
});

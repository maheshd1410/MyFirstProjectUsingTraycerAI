// @ts-nocheck
import { User, Product, Order, Address, UserRole, OrderStatus, PaymentStatus, PaymentMethod, ProductUnit } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Common test constants
export const TEST_USER_EMAIL = 'test@example.com';
export const TEST_USER_PHONE = '+1234567890';
export const TEST_PASSWORD = 'Test@1234';
export const TEST_PASSWORD_HASH = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEF';

// Factory function for creating mock users
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  email: TEST_USER_EMAIL,
  phoneNumber: TEST_USER_PHONE,
  password: TEST_PASSWORD_HASH,
  firstName: 'Test',
  lastName: 'User',
  role: UserRole.CUSTOMER,
  isActive: true,
  emailVerified: false,
  profileImage: null,
  refreshToken: null,
  fcmToken: null,
  notificationPrefsOrderUpdates: true,
  notificationPrefsPromotions: true,
  notificationPrefsReviews: true,
  failedLoginAttempts: 0,
  lockedUntil: null,
  lastFailedLogin: null,
  authProvider: 'EMAIL' as any,
  googleId: null,
  appleId: null,
  isEmailPasswordSet: true,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...overrides,
});

// Factory function for creating mock products
export const createMockProduct = (overrides?: Partial<Product>): Product => ({
  id: 'product-1',
  name: 'Test Product',
  description: 'Test product description',
  price: new Decimal('99.99'),
  discountPrice: null,
  categoryId: 'category-1',
  images: ['https://example.com/image1.jpg'],
  weight: 1.5,
  unit: ProductUnit.KG,
  stockQuantity: 100,
  lowStockThreshold: 5,
  isFeatured: false,
  isActive: true,
  averageRating: new Decimal('0'),
  totalReviews: 0,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...overrides,
});

// Factory function for creating mock addresses
export const createMockAddress = (overrides?: Partial<Address>): Address => ({
  id: 'address-1',
  userId: 'user-1',
  fullName: 'Test User',
  phoneNumber: TEST_USER_PHONE,
  addressLine1: '123 Test St',
  addressLine2: 'Apt 4B',
  city: 'Test City',
  state: 'Test State',
  postalCode: '12345',
  country: 'Test Country',
  isDefault: true,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...overrides,
});

// Factory function for creating mock orders
export const createMockOrder = (overrides?: Partial<Order>): Order => ({
  id: 'order-1',
  orderNumber: 'ORD-20250101-00001',
  userId: 'user-1',
  addressId: 'address-1',
  status: OrderStatus.PENDING,
  paymentStatus: PaymentStatus.PENDING,
  paymentMethod: PaymentMethod.CARD,
  subtotal: new Decimal('99.99'),
  taxAmount: new Decimal('9.99'),
  deliveryCharge: new Decimal('5.00'),
  discountAmount: new Decimal('0'),
  totalAmount: new Decimal('114.98'),
  couponId: null,
  couponCode: null,
  couponDiscount: new Decimal('0'),
  specialInstructions: null,
  estimatedDeliveryDate: new Date('2025-01-06T00:00:00.000Z'),
  deliveredAt: null,
  cancelledAt: null,
  cancellationReason: null,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...overrides,
});

// Factory function for creating mock categories
export const createMockCategory = (overrides?: any) => ({
  id: 'category-1',
  name: 'Test Category',
  description: 'Test category description',
  image: 'https://example.com/category.jpg',
  isActive: true,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...overrides,
});

// Factory function for creating mock cart items
export const createMockCartItem = (overrides?: any) => ({
  id: 'cart-item-1',
  userId: 'user-1',
  productId: 'product-1',
  quantity: 1,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  product: createMockProduct(),
  ...overrides,
});

// Factory function for creating mock reviews
export const createMockReview = (overrides?: any) => ({
  id: 'review-1',
  userId: 'user-1',
  productId: 'product-1',
  orderId: 'order-1',
  rating: 5,
  comment: 'Great product!',
  images: [],
  isModerated: false,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...overrides,
});

// Factory function for creating mock order items
export const createMockOrderItem = (overrides?: any) => ({
  id: 'order-item-1',
  orderId: 'order-1',
  productId: 'product-1',
  quantity: 1,
  price: new Decimal('99.99'),
  discount: new Decimal('0'),
  total: new Decimal('99.99'),
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...overrides,
});

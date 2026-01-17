import { PrismaClient } from '@prisma/client';
import { hashPassword } from './auth.helper';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

/**
 * Clear all data from database tables (in correct order to respect foreign keys)
 */
export async function clearDatabase() {
  await prisma.$transaction([
    // Delete in order that respects foreign key constraints
    prisma.notification.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.review.deleteMany(),
    prisma.wishlist.deleteMany(),
    prisma.address.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

/**
 * Create a test user in the database
 */
export async function createTestUser(overrides: any = {}) {
  const defaultUser = {
    email: `test-${Date.now()}@example.com`,
    password: await hashPassword('Password123!'),
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: `+1${Date.now().toString().slice(-9)}`,
    role: 'CUSTOMER',
    emailVerified: true,
    ...overrides,
  };

  return prisma.user.create({
    data: defaultUser,
  });
}

/**
 * Create a test category in the database
 */
export async function createTestCategory(overrides: any = {}) {
  const defaultCategory = {
    name: `Test Category ${Date.now()}`,
    description: 'Test category description',
    imageUrl: 'https://example.com/category.jpg',
    isActive: true,
    ...overrides,
  };

  return prisma.category.create({
    data: defaultCategory,
  });
}

/**
 * Create a test product in the database
 */
export async function createTestProduct(overrides: any = {}) {
  let categoryId = overrides.categoryId;

  // Create a category if not provided
  if (!categoryId) {
    const category = await createTestCategory();
    categoryId = category.id;
  }

  const defaultProduct = {
    name: `Test Product ${Date.now()}`,
    description: 'Test product description',
    price: new Decimal('99.99'),
    stockQuantity: 100,
    categoryId,
    images: ['https://example.com/product1.jpg', 'https://example.com/product2.jpg'],
    unit: 'KG',
    weight: new Decimal('1.5'),
    isFeatured: false,
    isActive: true,
    averageRating: new Decimal('0'),
    totalReviews: 0,
    ...overrides,
  };

  return prisma.product.create({
    data: defaultProduct,
    include: {
      category: true,
    },
  });
}

/**
 * Create a test address in the database
 */
export async function createTestAddress(userId: string, overrides: any = {}) {
  const defaultAddress = {
    userId,
    fullName: 'Test User',
    phoneNumber: '+1234567890',
    addressLine1: '123 Test Street',
    addressLine2: 'Apt 4B',
    city: 'Test City',
    state: 'Test State',
    postalCode: '12345',
    country: 'Test Country',
    isDefault: false,
    ...overrides,
  };

  return prisma.address.create({
    data: defaultAddress,
  });
}

/**
 * Create a test cart with items
 */
export async function createTestCart(userId: string, products: any[] = []) {
  const cart = await prisma.cart.create({
    data: {
      userId,
    },
  });

  if (products.length > 0) {
    await prisma.cartItem.createMany({
      data: products.map((product) => ({
        cartId: cart.id,
        productId: product.id,
        quantity: product.quantity || 1,
      })),
    });
  }

  return prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

/**
 * Create a test order
 */
export async function createTestOrder(userId: string, addressId: string, overrides: any = {}) {
  const defaultOrder = {
    userId,
    addressId,
    orderNumber: `ORD-${Date.now()}`,
    subtotal: new Decimal('100.00'),
    taxAmount: new Decimal('10.00'),
    deliveryCharge: new Decimal('5.00'),
    discountAmount: new Decimal('0.00'),
    totalAmount: new Decimal('115.00'),
    paymentMethod: 'CARD',
    paymentStatus: 'PENDING',
    status: 'PENDING',
    estimatedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    ...overrides,
  };

  return prisma.order.create({
    data: defaultOrder,
    include: {
      address: true,
      items: true,
    },
  });
}

/**
 * Create test order items
 */
export async function createTestOrderItems(orderId: string, products: any[] = []) {
  return prisma.orderItem.createMany({
    data: products.map((product) => ({
      orderId,
      productId: product.id,
      productName: product.name,
      productImage: product.images?.[0] || null,
      quantity: product.quantity || 1,
      unitPrice: product.price,
      totalPrice: new Decimal(product.price).mul(product.quantity || 1),
    })),
  });
}

/**
 * Create a test review
 */
export async function createTestReview(
  userId: string,
  productId: string,
  overrides: any = {}
) {
  const defaultReview = {
    userId,
    productId,
    rating: 5,
    comment: 'Great product!',
    isVerifiedPurchase: true,
    isModerated: false,
    ...overrides,
  };

  return prisma.review.create({
    data: defaultReview,
  });
}

/**
 * Create a test payment
 */
export async function createTestPayment(orderId: string, overrides: any = {}) {
  const defaultPayment = {
    orderId,
    amount: new Decimal('115.00'),
    method: 'CARD',
    status: 'PENDING',
    transactionId: `TXN-${Date.now()}`,
    ...overrides,
  };

  return prisma.payment.create({
    data: defaultPayment,
  });
}

/**
 * Seed basic test data (categories and products)
 */
export async function seedTestData() {
  // Create categories
  const electronics = await createTestCategory({
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
  });

  const clothing = await createTestCategory({
    name: 'Clothing',
    description: 'Fashion and apparel',
  });

  // Create products
  const products = await Promise.all([
    createTestProduct({
      name: 'Smartphone',
      price: new Decimal('699.99'),
      categoryId: electronics.id,
      isFeatured: true,
    }),
    createTestProduct({
      name: 'Laptop',
      price: new Decimal('1299.99'),
      categoryId: electronics.id,
      isFeatured: true,
    }),
    createTestProduct({
      name: 'T-Shirt',
      price: new Decimal('29.99'),
      categoryId: clothing.id,
      isFeatured: false,
    }),
    createTestProduct({
      name: 'Jeans',
      price: new Decimal('79.99'),
      categoryId: clothing.id,
      isFeatured: false,
    }),
  ]);

  return {
    categories: [electronics, clothing],
    products,
  };
}

/**
 * Clean test data (users with test- prefix in email)
 */
export async function cleanTestUsers() {
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'test-',
      },
    },
  });
}

/**
 * Disconnect Prisma client
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

/**
 * Get Prisma client instance for tests
 */
export function getPrismaClient() {
  return prisma;
}

/**
 * Create admin user convenience function
 */
export async function createAdminUser(overrides: any = {}) {
  return createTestUser({ role: 'ADMIN', ...overrides });
}

/**
 * Create test wishlist with items
 */
export async function createTestWishlist(userId: string, products: any[]) {
  // Create wishlist items directly (Wishlist model is the items)
  const wishlistItems = await Promise.all(
    products.map((product) =>
      prisma.wishlist.create({
        data: {
          userId,
          productId: product.id,
        },
      })
    )
  );

  return wishlistItems;
}

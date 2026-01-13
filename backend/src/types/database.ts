import { Prisma } from '@prisma/client';

// Export all Prisma model types
export type User = Prisma.UserGetPayload<{}>;
export type Address = Prisma.AddressGetPayload<{}>;
export type Category = Prisma.CategoryGetPayload<{}>;
export type Product = Prisma.ProductGetPayload<{}>;
export type Cart = Prisma.CartGetPayload<{}>;
export type CartItem = Prisma.CartItemGetPayload<{}>;
export type Order = Prisma.OrderGetPayload<{}>;
export type OrderItem = Prisma.OrderItemGetPayload<{}>;
export type Payment = Prisma.PaymentGetPayload<{}>;
export type Review = Prisma.ReviewGetPayload<{}>;
export type Notification = Prisma.NotificationGetPayload<{}>;

// Export Prisma enums
export {
  UserRole,
  ProductUnit,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ModerationStatus,
  NotificationType,
} from '@prisma/client';

// Custom API response types
export type UserWithoutPassword = Omit<User, 'password'>;

export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: true };
}>;

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    user: { select: { id: true; email: true; firstName: true; lastName: true } };
    address: true;
    items: {
      include: { product: true };
    };
    payment: true;
  };
}>;

export type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: {
      include: { product: true };
    };
  };
}>;

export type ReviewWithUser = Prisma.ReviewGetPayload<{
  include: { user: { select: { id: true; firstName: true; profileImage: true } } };
}>;

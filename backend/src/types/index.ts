import { Request } from 'express';
import { UserRole } from '@prisma/client';

// Shared backend types
export * from './database';

// Authentication DTOs
export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role?: UserRole;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

// Authentication Response
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
}

// Profile DTOs
export interface UpdateProfileDTO {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  profileImage?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Extended Express Request with user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
      };
    }
  }
}

// Address DTOs
export interface CreateAddressDTO {
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface UpdateAddressDTO {
  fullName?: string;
  phoneNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface AddressResponse {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product DTOs
export interface CreateProductDTO {
  name: string;
  description: string;
  price: string | number;
  discountPrice?: string | number;
  images: string[];
  categoryId: string;
  stockQuantity: number;
  weight?: number;
  unit: 'KG' | 'GRAM' | 'PIECE' | 'BOX';
  isFeatured?: boolean;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: string | number;
  discountPrice?: string | number;
  images?: string[];
  categoryId?: string;
  stockQuantity?: number;
  weight?: number;
  unit?: 'KG' | 'GRAM' | 'PIECE' | 'BOX';
  isFeatured?: boolean;
}

export interface ProductFilterDTO {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'rating';
  inStock?: boolean;
  minRating?: number;
}

export interface ProductResponse {
  id: string;
  name: string;
  description: string;
  price: string;
  discountPrice?: string;
  images: string[];
  category: {
    id: string;
    name: string;
  };
  stockQuantity: number;
  weight?: number;
  unit: string;
  isFeatured: boolean;
  averageRating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

// Category DTOs
export interface CreateCategoryDTO {
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  description?: string;
  imageUrl?: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Cart DTOs
export interface CartItemDTO {
  productId: string;
  quantity: number;
}

export interface CartItemResponse {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: string;
  discountPrice?: string;
  quantity: number;
  subtotal: string;
  createdAt: Date;
}

export interface CartResponse {
  id: string;
  userId: string;
  items: CartItemResponse[];
  totalItems: number;
  totalAmount: string;
  createdAt: Date;
  updatedAt: Date;
}

// Wishlist DTOs
export interface WishlistItemResponse {
  id: string;
  productId: string;
  product: ProductResponse;
  createdAt: Date;
}

export interface WishlistResponse {
  items: WishlistItemResponse[];
  totalItems: number;
}

// Order DTOs
export interface CreateOrderDTO {
  addressId: string;
  paymentMethod: 'CARD' | 'UPI' | 'COD' | 'WALLET';
  specialInstructions?: string;
}

export interface UpdateOrderStatusDTO {
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
}

export interface CancelOrderDTO {
  cancellationReason: string;
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: string;
  taxAmount: string;
  deliveryCharge: string;
  discountAmount: string;
  totalAmount: string;
  specialInstructions: string | null;
  estimatedDeliveryDate: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  address: AddressResponse;
  items: OrderItemResponse[];
}

// Payment DTOs
export interface CreatePaymentIntentDTO {
  orderId: string;
  amount: number;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentResponse {
  id: string;
  orderId: string;
  stripePaymentIntentId: string | null;
  amount: string;
  currency: string;
  status: string;
  paymentMethod: string | null;
  transactionId: string | null;
  failureReason: string | null;
  refundedAmount: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefundPaymentDTO {
  paymentId: string;
  amount?: number;
}

export interface WebhookEventData {
  type: string;
  data: {
    object: any;
  };
}

// Review DTOs
export interface CreateReviewDTO {
  productId: string;
  orderId: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface UpdateReviewDTO {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface ModerateReviewDTO {
  moderationStatus: 'APPROVED' | 'REJECTED';
  moderationNote?: string;
}

export interface ReviewResponse {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  orderId: string;
  rating: number;
  title?: string;
  comment?: string;
  images: string[];
  isVerifiedPurchase: boolean;
  moderationStatus: string;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// User and Auth Types
export type UserRole = 'CUSTOMER' | 'ADMIN';

// Loading State Types
export interface LoadingState {
  fetch: boolean;
  refresh: boolean;
  loadMore: boolean;
  action: boolean;
  upload: boolean;
}

export interface OptimisticUpdate<T> {
  id: string;
  type: 'add' | 'update' | 'remove';
  data: T;
  timestamp: number;
}

// Re-export admin types
export {
  type AdminAnalytics,
  type AdminOrderFilters,
  type AdminUserFilters,
  type UserManagement,
  type UserManagementDetail,
  type AdminState,
} from './admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  profileImage?: string;
  createdAt?: string;
}


export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Authentication DTOs
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  isNewUser?: boolean;
}

// Profile Types
export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImage?: string;
}

export interface ProfileState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Product and Category Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  price?: string;
  discountPrice?: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
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
  unit: 'KG' | 'GRAM' | 'PIECE' | 'BOX';
  isFeatured: boolean;
  averageRating: number;
  totalReviews: number;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'rating';
}

export interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  categories: Category[];
  loading: LoadingState;
  error: string | null;
  filters: ProductFilterParams;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}
// Cart Types
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: string;
  discountPrice?: string;
  quantity: number;
  subtotal: string;
  variantId?: string;
  variantName?: string;
  variantAttributes?: Record<string, string>;
  createdAt: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartState {
  cart: Cart | null;
  loading: LoadingState;
  error: string | null;
  optimisticUpdates: OptimisticUpdate<CartItem>[];
}

// Wishlist Types
export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  createdAt: string;
}

export interface Wishlist {
  items: WishlistItem[];
  totalItems: number;
}

export interface WishlistState {
  wishlist: Wishlist | null;
  loading: LoadingState;
  error: string | null;
  optimisticUpdates: OptimisticUpdate<WishlistItem>[];
}

// Address Types
export interface Address {
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressData {
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

export interface UpdateAddressData {
  fullName?: string;
  phoneNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface AddressState {
  addresses: Address[];
  selectedAddress: Address | null;
  loading: boolean;
  error: string | null;
}

// Coupon Types
export type CouponDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

export interface Coupon {
  id: string;
  code: string;
  name: string;
  discountType: CouponDiscountType;
  discountValue: string;
  minOrderAmount?: string;
  maxDiscountAmount?: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface CouponValidationResult {
  isValid: boolean;
  discountAmount: number;
  finalAmount: number;
  message?: string;
  isFreeShipping?: boolean;
  couponId?: string;
  coupon?: Coupon;
}

// Order Types
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type PaymentMethod = 'CARD' | 'UPI' | 'COD' | 'WALLET';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  variantId?: string;
  variantSku?: string;
  variantName?: string;
  variantAttributes?: Record<string, string>;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  subtotal: string;
  taxAmount: string;
  deliveryCharge: string;
  discountAmount: string;
  couponDiscount: string;
  couponCode: string | null;
  couponId: string | null;
  totalAmount: string;
  specialInstructions: string | null;
  estimatedDeliveryDate: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  address: Address;
  items: OrderItem[];
}

export interface CreateOrderRequest {
  addressId: string;
  paymentMethod: PaymentMethod;
  specialInstructions?: string;
  couponCode?: string;
}

export interface CancelOrderRequest {
  cancellationReason: string;
}

export interface OrderFilterParams {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
}

export interface OrderPagination {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export type PaginatedOrders = {
  orders: Order[];
  pagination: OrderPagination;
};

export interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  loading: LoadingState;
  error: string | null;
  pagination: OrderPagination;
}
// Admin Types
export interface AdminAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  activeUsers: number;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  usersByRole: Array<{
    role: string;
    count: number;
  }>;
  recentOrders: Order[];
  topProducts: Array<{
    id: string;
    name: string;
    image?: string;
    price: string;
    orderCount: number;
    totalQuantitySold: number;
  }>;
  revenueByDate: Array<{
    date: string;
    amount: number;
  }>;
}

export interface AdminOrderFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface AdminUserFilters {
  page?: number;
  pageSize?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
}

export interface UserManagement {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
  avatar?: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

export interface UserManagementDetail extends UserManagement {
  avgOrderValue: number;
  orders: Array<{
    id: string;
    orderNumber: string;
    totalAmount: string;
    status: string;
    createdAt: string;
  }>;
}

export interface AdminState {
  analytics: AdminAnalytics | null;
  orders: Array<Order>;
  users: Array<UserManagement>;
  selectedUser: UserManagementDetail | null;
  loading: boolean;
  error: string | null;
  orderPagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    total: number;
  } | null;
  userPagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    total: number;
  } | null;
}
// Payment Types
export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
}

// Review Types
export type ModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Review {
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
  moderationStatus: ModerationStatus;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewData {
  orderId: string;
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface UpdateReviewData {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export interface ReviewFilterParams {
  page?: number;
  pageSize?: number;
  sortBy?: 'newest' | 'helpful' | 'rating-high' | 'rating-low';
}

export interface ReviewPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface ReviewState {
  reviews: Review[];
  userReviews: Review[];
  loading: LoadingState;
  error: string | null;
  pagination: ReviewPagination;
}

// Network and Offline Types
export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  lastOnlineTime: number | null;
}

export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  priority?: 'high' | 'medium' | 'low';
}
// Admin Types
export interface AdminAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  activeUsers: number;
  ordersByStatus: {
    PENDING: number;
    CONFIRMED: number;
    PREPARING: number;
    OUT_FOR_DELIVERY: number;
    DELIVERED: number;
    CANCELLED: number;
    REFUNDED: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: OrderStatus;
    totalAmount: string;
    createdAt: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    orderCount: number;
    revenue: number;
  }>;
  revenueByDate: Array<{
    date: string;
    revenue: number;
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
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

export interface UserManagementDetail extends UserManagement {
  totalOrders: number;
  averageOrderValue: number;
  orders: Order[];
}

export interface AdminState {
  analytics: AdminAnalytics | null;
  orders: Array<Order & { user: { firstName: string; lastName: string; email: string } }>;
  users: UserManagement[];
  selectedUser: UserManagementDetail | null;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  } | null;
}

export type TabParamList = {
  Home: undefined;
  Products: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};

export type ProductStackParamList = {
  ProductList: undefined;
  ProductDetail: { productId: string };
};

export type AppStackParamList = {
  MainTabs: undefined;
  ProductDetail: { productId: string };
  Search: undefined;
  Wishlist: undefined;
  OrderList: undefined;
  OrderDetail: { orderId: string };
  OrderTracking: { orderId: string };
  AddressList: undefined;
  AddressForm: { address?: any; mode: 'create' | 'edit' };
  Checkout: undefined;
  Payment: { orderId: string };
  OrderConfirmation: { orderId: string };
  EditProfile: undefined;
  NotificationPreferences: undefined;
  Notifications: undefined;
  OfflineQueue: undefined;
  WriteReview: { productId: string; orderId: string };
  AdminDashboard: undefined;
  AdminProductManagement: undefined;
  AdminProductForm: { productId?: string };
  AdminOrderManagement: undefined;
  AdminOrderDetail: { orderId: string };
  AdminUserManagement: undefined;
  AdminUserDetail: { userId: string };
};

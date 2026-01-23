import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppTheme } from '../theme';
import type { AppStackParamList } from './types';
import { TabNavigator } from './TabNavigator';
import {
  ProductDetailScreen,
  SearchScreen,
  WishlistScreen,
  OrderListScreen,
  OrderDetailScreen,
  OrderTrackingScreen,
  AddressListScreen,
  AddressFormScreen,
  CheckoutScreen,
  PaymentScreen,
  OrderConfirmationScreen,
  EditProfileScreen,
  NotificationPreferencesScreen,
  NotificationsScreen,
  WriteReviewScreen,
  AdminDashboardScreen,
  AdminProductManagementScreen,
  AdminProductFormScreen,
  AdminOrderManagementScreen,
  AdminOrderDetailScreen,
  AdminUserManagementScreen,
  AdminUserDetailScreen,
} from '../screens';
import { OfflineQueueScreen } from '../screens/profile/OfflineQueueScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator: React.FC = () => {
  const theme = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          ...theme.typography.titleLarge,
        },
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="OrderList" component={OrderListScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <Stack.Screen name="AddressList" component={AddressListScreen} />
      <Stack.Screen name="AddressForm" component={AddressFormScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="OfflineQueue" component={OfflineQueueScreen} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminProductManagement" component={AdminProductManagementScreen} />
      <Stack.Screen name="AdminProductForm" component={AdminProductFormScreen} />
      <Stack.Screen name="AdminOrderManagement" component={AdminOrderManagementScreen} />
      <Stack.Screen name="AdminOrderDetail" component={AdminOrderDetailScreen} />
      <Stack.Screen name="AdminUserManagement" component={AdminUserManagementScreen} />
      <Stack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} />
    </Stack.Navigator>
  );
};

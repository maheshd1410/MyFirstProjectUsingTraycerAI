import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectCartItemCount, selectCart, fetchCart } from '../store/cart/cartSlice';
import { selectIsAuthenticated } from '../store/auth/authSlice';
import { selectUnreadCount } from '../store/notification/notificationSlice';
import { theme } from '../theme';
import { Review } from '../types';
import {
  CartScreen,
  ProductListScreen,
  ProductDetailScreen,
  AddressListScreen,
  AddressFormScreen,
  CheckoutScreen,
  PaymentScreen,
  OrderConfirmationScreen,
  NotificationsScreen,
  NotificationPreferencesScreen,
  ProfileScreen,
  EditProfileScreen,
  WriteReviewScreen,
  SearchScreen,
  WishlistScreen,
  AdminDashboardScreen,
  AdminProductManagementScreen,
  AdminProductFormScreen,
  AdminOrderManagementScreen,
  AdminOrderDetailScreen,
  AdminUserManagementScreen,
  AdminUserDetailScreen,
} from '../screens';

export type AppStackParamList = {
  MainTabs: undefined;
  EditProfile: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  AddressList: undefined;
  AddressForm: { address?: any; mode: 'create' | 'edit' };
  Checkout: undefined;
  Payment: { orderId: string };
  OrderConfirmation: { orderId: string };
  Notifications: undefined;
  NotificationPreferences: undefined;
  Search: undefined;
  WriteReview: {
    orderId: string;
    productId: string;
    productName: string;
    productImage: string;
    existingReview?: Review;
  };
  AdminDashboard: undefined;
  AdminProductManagement: undefined;
  AdminProductForm: { productId?: string };
  AdminOrderManagement: undefined;
  AdminOrderDetail: { orderId: string };
  AdminUserManagement: undefined;
  AdminUserDetail: { userId: string };
};

export type TabParamList = {
  Home: undefined;
  ProductList: undefined;
  Wishlist: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Placeholder screens
const HomeScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Home Screen</Text>
    <Text style={styles.subtext}>(Coming soon)</Text>
  </View>
);

// Cart Badge Component
const CartBadge: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const cartItemCount = useAppSelector(selectCartItemCount);

  return (
    <TouchableOpacity style={styles.cartIconContainer} onPress={onPress}>
      <Text style={styles.cartIcon}>🛒</Text>
      {cartItemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{cartItemCount > 99 ? '99+' : cartItemCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Notification Bell Icon Component with Badge
const NotificationBell: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const unreadCount = useAppSelector(selectUnreadCount);

  return (
    <TouchableOpacity style={styles.notificationIconContainer} onPress={onPress}>
      <Text style={styles.notificationIcon}>🔔</Text>
      {unreadCount > 0 && (
        <View style={styles.notificationBadge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Search Icon Component
const SearchIcon: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.searchIconContainer} onPress={onPress}>
      <Ionicons name="search" size={24} color={theme.colors.background} />
    </TouchableOpacity>
  );
};

// Bottom Tab Navigator Component
const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ProductList') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Wishlist') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{ title: 'Products' }}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          title: 'Wishlist',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const cart = useAppSelector(selectCart);

  // Fetch cart once when user is authenticated and cart not yet loaded
  useEffect(() => {
    if (isAuthenticated && !cart) {
      dispatch(fetchCart());
    }
  }, [isAuthenticated, cart, dispatch]);

  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.background,
        headerTitleStyle: {
          fontWeight: theme.typography.fontWeights.semibold,
          fontSize: theme.typography.fontSizes.lg,
        },
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            <SearchIcon onPress={() => navigation.navigate('Search')} />
            <NotificationBell onPress={() => navigation.navigate('Notifications')} />
            <CartBadge onPress={() => navigation.navigate('Cart')} />
          </View>
        ),
      })}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          title: 'Product Details',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'My Cart' }}
      />
      <Stack.Screen
        name="AddressList"
        component={AddressListScreen}
        options={{ title: 'My Addresses' }}
      />
      <Stack.Screen
        name="AddressForm"
        component={AddressFormScreen}
        options={({ route }) => ({
          title: route.params?.mode === 'create' ? 'Add Address' : 'Edit Address',
          headerBackTitle: 'Back',
        })}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{
          title: 'Payment',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="OrderConfirmation"
        component={OrderConfirmationScreen}
        options={{
          title: 'Order Confirmed',
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="NotificationPreferences"
        component={NotificationPreferencesScreen}
        options={{
          title: 'Notification Preferences',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="WriteReview"
        component={WriteReviewScreen}
        options={{
          title: 'Write Review',
          headerBackTitle: 'Cancel',
        }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Search Products',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          title: 'Admin Dashboard',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="AdminProductManagement"
        component={AdminProductManagementScreen}
        options={{
          title: 'Product Management',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="AdminProductForm"
        component={AdminProductFormScreen}
        options={({ route }) => ({
          title: route.params?.productId ? 'Edit Product' : 'Add Product',
          headerBackTitle: 'Back',
        })}
      />
      <Stack.Screen
        name="AdminOrderManagement"
        component={AdminOrderManagementScreen}
        options={{
          title: 'Order Management',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="AdminOrderDetail"
        component={AdminOrderDetailScreen}
        options={{
          title: 'Order Details',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="AdminUserManagement"
        component={AdminUserManagementScreen}
        options={{
          title: 'User Management',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="AdminUserDetail"
        component={AdminUserDetailScreen}
        options={{
          title: 'User Details',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  text: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
  },
  subtext: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    marginTop: theme.spacing.md,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  searchIconContainer: {
    marginRight: theme.spacing.md,
  },
  notificationIconContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  notificationIcon: {
    fontSize: 24,
  },
  cartIconContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  cartIcon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: theme.colors.background,
    fontSize: 12,
    fontWeight: theme.typography.fontWeights.bold,
  },
});

import { Middleware } from '@reduxjs/toolkit';
import { addToQueue, syncOfflineActions, thunkRegistry } from '../store/offline/offlineSlice';
import { setNetworkStatus } from '../store/network/networkSlice';
import { RootState } from '../store';

// Import thunk action creators to register them
import { addToCart, updateCartItem, removeFromCart } from '../store/cart/cartSlice';
import { addToWishlist, removeFromWishlistAsync } from '../store/wishlist/wishlistSlice';
import { createOrder, cancelOrder } from '../store/order/orderSlice';
import { addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../store/address/addressSlice';
import { submitReview } from '../store/review/reviewSlice';

// Register all thunk action creators
const registerThunks = () => {
  // Cart thunks
  thunkRegistry.set('cart/addToCart', addToCart);
  thunkRegistry.set('cart/updateCartItem', updateCartItem);
  thunkRegistry.set('cart/removeFromCart', removeFromCart);
  
  // Wishlist thunks
  thunkRegistry.set('wishlist/addToWishlist', addToWishlist);
  thunkRegistry.set('wishlist/removeFromWishlistAsync', removeFromWishlistAsync);
  
  // Order thunks
  thunkRegistry.set('order/createOrder', createOrder);
  thunkRegistry.set('order/cancelOrder', cancelOrder);
  
  // Address thunks
  thunkRegistry.set('address/addAddress', addAddress);
  thunkRegistry.set('address/updateAddress', updateAddress);
  thunkRegistry.set('address/deleteAddress', deleteAddress);
  thunkRegistry.set('address/setDefaultAddress', setDefaultAddress);
  
  // Review thunks
  thunkRegistry.set('review/submitReview', submitReview);
};

// Initialize thunk registry
registerThunks();

const NETWORK_ERROR_CODES = [
  'ECONNABORTED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'ENETUNREACH',
  'ERR_NETWORK',
  'ERR_CONNECTION_REFUSED',
];

const isNetworkError = (error: any): boolean => {
  if (!error) return false;

  const message = error.message || '';
  const code = error.code || '';

  return (
    NETWORK_ERROR_CODES.some((errCode) => code.includes(errCode)) ||
    message.toLowerCase().includes('network') ||
    message.toLowerCase().includes('offline') ||
    message.toLowerCase().includes('connection')
  );
};

export const offlineMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  // Pass through non-thunk actions
  if (typeof action !== 'object' || !action.type) {
    return next(action);
  }

  const result = next(action);

  // Listen for network status changes
  if (action.type === setNetworkStatus.type) {
    const { isConnected } = action.payload;
    const state = store.getState();
    
    // Trigger sync when connection is restored
    if (isConnected && state.offline.queue.length > 0 && !state.offline.isProcessing) {
      console.log('Connection restored, syncing offline queue...');
      setTimeout(() => {
        store.dispatch(syncOfflineActions());
      }, 1000); // Delay to ensure connection is stable
    }
  }

  // Handle rejected async thunks
  if (action.type && action.type.endsWith('/rejected')) {
    const error = action.payload || action.error;
    
    if (isNetworkError(error)) {
      console.log('Network error detected, queueing action:', action.type);
      
      // Extract original action details
      const baseType = action.type.replace('/rejected', '');
      const meta = (action as any).meta;
      
      // Only queue if action has metadata and payload
      if (meta && meta.arg !== undefined) {
        store.dispatch(
          addToQueue({
            type: baseType,
            payload: meta.arg,
            priority: determineActionPriority(baseType),
          })
        );
      }
    }
  }

  return result;
};

// Determine action priority based on type
const determineActionPriority = (actionType: string): 'high' | 'medium' | 'low' => {
  // High priority: critical actions like orders, payments
  if (
    actionType.includes('order/create') ||
    actionType.includes('payment') ||
    actionType.includes('checkout')
  ) {
    return 'high';
  }

  // Medium priority: cart, wishlist, profile updates
  if (
    actionType.includes('cart') ||
    actionType.includes('wishlist') ||
    actionType.includes('profile/update') ||
    actionType.includes('address')
  ) {
    return 'medium';
  }

  // Low priority: reviews, analytics, etc.
  return 'low';
};

export default offlineMiddleware;

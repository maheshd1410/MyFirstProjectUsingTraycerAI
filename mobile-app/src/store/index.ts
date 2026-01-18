import { configureStore, ThunkAction, Action, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './auth/authSlice';
import productReducer from './product/productSlice';
import cartReducer from './cart/cartSlice';
import wishlistReducer from './wishlist/wishlistSlice';
import addressReducer from './address/addressSlice';
import orderReducer from './order/orderSlice';
import notificationReducer from './notification/notificationSlice';
import profileReducer from './profile/profileSlice';
import reviewReducer from './review/reviewSlice';
import adminReducer from './admin/adminSlice';
import offlineReducer from './offline/offlineSlice';
import networkReducer from './network/networkSlice';
import offlineMiddleware from '../middleware/offlineMiddleware';

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  product: productReducer,
  cart: cartReducer,
  wishlist: wishlistReducer,
  address: addressReducer,
  order: orderReducer,
  profile: profileReducer,
  notification: notificationReducer,
  review: reviewReducer,
  admin: adminReducer,
  offline: offlineReducer,
  network: networkReducer,
});

// Redux persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'offline', 'product', 'cart', 'wishlist', 'network'], // Persist offline-capable slices
};

// Apply persistReducer to the root reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredActionPaths: ['payload.user'],
        ignoredPaths: ['auth'],
      },
    }).concat(offlineMiddleware),
});

// Create persistor
export const persistor = persistStore(store);

// Type exports
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

// Export hooks
export { useAppDispatch, useAppSelector } from './hooks';


import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCartAsync,
  selectCart,
  selectCartItems,
  selectCartTotal,
  selectCartItemCount,
  selectCartLoading,
  selectCartError,
  clearError,
} from '../store/cart/cartSlice';

/**
 * Custom hook for cart operations and state management
 * Provides a clean interface to cart functionality
 */
export const useCart = () => {
  const dispatch = useAppDispatch();
  const cart = useAppSelector(selectCart);
  const items = useAppSelector(selectCartItems);
  const totalAmount = useAppSelector(selectCartTotal);
  const itemCount = useAppSelector(selectCartItemCount);
  const loading = useAppSelector(selectCartLoading);
  const error = useAppSelector(selectCartError);

  const loadCart = useCallback(() => {
    return dispatch(fetchCart());
  }, [dispatch]);

  const addItem = useCallback(
    (productId: string, quantity: number) => {
      return dispatch(addToCart({ productId, quantity }));
    },
    [dispatch]
  );

  const updateItem = useCallback(
    (itemId: string, quantity: number) => {
      return dispatch(updateCartItem({ itemId, quantity }));
    },
    [dispatch]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      return dispatch(removeFromCart(itemId));
    },
    [dispatch]
  );

  const clear = useCallback(() => {
    return dispatch(clearCartAsync());
  }, [dispatch]);

  const resetError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    cart,
    items,
    totalAmount,
    itemCount,
    loading,
    error,
    // Actions
    loadCart,
    addItem,
    updateItem,
    removeItem,
    clear,
    resetError,
  };
};

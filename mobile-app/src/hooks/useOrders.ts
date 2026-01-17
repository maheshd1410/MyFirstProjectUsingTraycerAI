import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchOrders,
  fetchOrderById,
  createOrder,
  cancelOrder,
  selectOrders,
  selectSelectedOrder,
  selectOrderLoading,
  selectOrderError,
  selectOrderPagination,
  clearError,
  setSelectedOrder,
} from '../store/order/orderSlice';
import { CreateOrderRequest, OrderFilterParams } from '../types';

/**
 * Custom hook for order operations and state management
 * Provides a clean interface to order functionality
 */
export const useOrders = () => {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectOrders);
  const selectedOrder = useAppSelector(selectSelectedOrder);
  const loading = useAppSelector(selectOrderLoading);
  const error = useAppSelector(selectOrderError);
  const pagination = useAppSelector(selectOrderPagination);

  const loadOrders = useCallback(
    (filters?: OrderFilterParams) => {
      return dispatch(fetchOrders(filters));
    },
    [dispatch]
  );

  const loadOrderById = useCallback(
    (orderId: string) => {
      return dispatch(fetchOrderById(orderId));
    },
    [dispatch]
  );

  const placeOrder = useCallback(
    (data: CreateOrderRequest) => {
      return dispatch(createOrder(data));
    },
    [dispatch]
  );

  const cancel = useCallback(
    (orderId: string, cancellationReason: string) => {
      return dispatch(cancelOrder({ orderId, cancellationReason }));
    },
    [dispatch]
  );

  const resetError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const selectOrder = useCallback(
    (order) => {
      dispatch(setSelectedOrder(order));
    },
    [dispatch]
  );

  return {
    // State
    orders,
    selectedOrder,
    loading,
    error,
    pagination,
    // Actions
    loadOrders,
    loadOrderById,
    placeOrder,
    cancel,
    resetError,
    selectOrder,
  };
};

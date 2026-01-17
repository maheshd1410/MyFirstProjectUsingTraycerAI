import api from './api';
import {
  Order,
  CreateOrderRequest,
  CancelOrderRequest,
  OrderFilterParams,
  PaginatedOrders,
} from '../types';

/**
 * Create a new order from cart
 * POST /orders
 */
export const createOrder = async (data: CreateOrderRequest): Promise<Order> => {
  const response = await api.post<Order>('/orders', data);
  return response.data;
};

/**
 * Get user's orders with optional filters and pagination metadata
 * GET /orders
 */
export const getOrders = async (filters?: OrderFilterParams): Promise<PaginatedOrders> => {
  const response = await api.get<PaginatedOrders>('/orders', {
    params: filters,
  });
  return response.data;
};

/**
 * Get single order by ID
 * GET /orders/:id
 */
export const getOrderById = async (orderId: string): Promise<Order> => {
  const response = await api.get<Order>(`/orders/${orderId}`);
  return response.data;
};

/**
 * Cancel an order
 * DELETE /orders/:id
 */
export const cancelOrder = async (
  orderId: string,
  cancellationReason: string
): Promise<Order> => {
  const response = await api.delete<Order>(`/orders/${orderId}`, {
    data: { cancellationReason },
  });
  return response.data;
};

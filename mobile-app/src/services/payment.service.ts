import api from './api';
import { PaymentIntentResponse } from '../types';

/**
 * Create a payment intent for an order
 * POST /payment/create-payment-intent
 */
export const createPaymentIntent = async (orderId: string): Promise<PaymentIntentResponse> => {
  try {
    const response = await api.post<PaymentIntentResponse>('/payment/create-payment-intent', {
      orderId,
    });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || 'Failed to create payment intent';
    throw new Error(errorMessage);
  }
};

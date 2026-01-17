import api from './api';

// Cart types matching backend response
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: string;
  discountPrice?: string;
  quantity: number;
  subtotal: string;
  createdAt: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

/**
 * Get user's cart
 */
export const getCart = async (): Promise<Cart> => {
  const response = await api.get('/cart');
  return response.data;
};

/**
 * Add item to cart
 */
export const addToCart = async (productId: string, quantity: number): Promise<Cart> => {
  const response = await api.post('/cart/items', {
    productId,
    quantity,
  } as AddToCartRequest);
  return response.data;
};

/**
 * Update cart item quantity
 */
export const updateCartItem = async (itemId: string, quantity: number): Promise<Cart> => {
  const response = await api.put(`/cart/items/${itemId}`, {
    quantity,
  } as UpdateCartItemRequest);
  return response.data;
};

/**
 * Remove item from cart
 */
export const removeCartItem = async (itemId: string): Promise<Cart> => {
  const response = await api.delete(`/cart/items/${itemId}`);
  return response.data;
};

/**
 * Clear entire cart
 */
export const clearCart = async (): Promise<void> => {
  await api.delete('/cart');
};

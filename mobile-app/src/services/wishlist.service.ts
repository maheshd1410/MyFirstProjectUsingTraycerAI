import api from './api';
import { Wishlist } from '../types';

export const getWishlist = async (): Promise<Wishlist> => {
  const response = await api.get('/wishlist');
  return response.data;
};

export const addToWishlist = async (productId: string): Promise<Wishlist> => {
  const response = await api.post('/wishlist/items', { productId });
  return response.data;
};

export const removeFromWishlist = async (productId: string): Promise<Wishlist> => {
  const response = await api.delete(`/wishlist/items/${productId}`);
  return response.data;
};

export const checkWishlistStatus = async (
  productId: string,
): Promise<{ inWishlist: boolean }> => {
  const response = await api.get(`/wishlist/check/${productId}`);
  return response.data;
};

export const clearWishlist = async (): Promise<void> => {
  await api.delete('/wishlist');
};

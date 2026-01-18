import api from './api';
import { ProductVariant } from '../types';

export interface CreateVariantRequest {
  productId: string;
  sku: string;
  name: string;
  attributes?: Record<string, string>;
  price?: string;
  discountPrice?: string;
  stockQuantity: number;
  lowStockThreshold?: number;
  sortOrder?: number;
}

export const variantService = {
  /**
   * Create a new product variant
   */
  createVariant: async (data: CreateVariantRequest): Promise<ProductVariant> => {
    const response = await api.post('/variants', data);
    return response.data;
  },

  /**
   * Update an existing product variant
   */
  updateVariant: async (variantId: string, data: Partial<CreateVariantRequest>): Promise<ProductVariant> => {
    const response = await api.put(`/variants/${variantId}`, data);
    return response.data;
  },

  /**
   * Delete a product variant
   */
  deleteVariant: async (variantId: string): Promise<void> => {
    await api.delete(`/variants/${variantId}`);
  },

  /**
   * Get all variants for a product
   */
  getVariantsByProduct: async (productId: string): Promise<ProductVariant[]> => {
    const response = await api.get(`/variants/product/${productId}`);
    return response.data;
  },

  /**
   * Get a single variant by ID
   */
  getVariantById: async (variantId: string): Promise<ProductVariant> => {
    const response = await api.get(`/variants/${variantId}`);
    return response.data;
  },

  /**
   * Check low stock variants for a product
   */
  checkLowStock: async (productId: string): Promise<ProductVariant[]> => {
    const response = await api.get(`/variants/product/${productId}/low-stock`);
    return response.data;
  },
};

import api from './api';
import { Product, Category, ProductFilterParams } from '../types';

export const getProducts = async (filters?: ProductFilterParams) => {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.minRating !== undefined) params.append('minRating', filters.minRating.toString());
    if (filters.inStock !== undefined) params.append('inStock', filters.inStock.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
  }

  const response = await api.get(`/products?${params.toString()}`);
  return response.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const getFeaturedProducts = async (): Promise<Product[]> => {
  const response = await api.get('/products/featured');
  return response.data;
};

export const getProductsByCategory = async (
  categoryId: string,
  filters?: ProductFilterParams
) => {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.minRating !== undefined) params.append('minRating', filters.minRating.toString());
    if (filters.inStock !== undefined) params.append('inStock', filters.inStock.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
  }

  const response = await api.get(`/products/category/${categoryId}?${params.toString()}`);
  return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get('/categories');
  return response.data;
};

export const getCategoryById = async (id: string): Promise<Category> => {
  const response = await api.get(`/categories/${id}`);
  return response.data;
};

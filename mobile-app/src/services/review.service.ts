import api from './api';
import { CreateReviewData, UpdateReviewData, Review, ReviewFilterParams } from '../types';

export const createReview = async (data: CreateReviewData): Promise<Review> => {
  // Send as JSON only - backend expects images array of URLs, not multipart FormData
  const response = await api.post('/reviews', data);
  return response.data;
};

export const updateReview = async (reviewId: string, data: UpdateReviewData): Promise<Review> => {
  // Send as JSON only
  const response = await api.put(`/reviews/${reviewId}`, data);
  return response.data;
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  await api.delete(`/reviews/${reviewId}`);
};

export const getProductReviews = async (
  productId: string,
  filters?: ReviewFilterParams
): Promise<{ reviews: Review[]; pagination: any }> => {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);

  const response = await api.get(`/reviews/product/${productId}?${params.toString()}`);
  
  // Map backend response to client pagination format
  // Backend returns: { reviews, total, page, pageSize }
  // Client expects: { reviews, pagination: { currentPage, totalPages, totalItems } }
  const { data } = response;
  const pageSize = data.pageSize || 10;
  const currentPage = data.page || 1;
  const totalItems = data.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return {
    reviews: data.reviews || data,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
    },
  };
};

export const getUserReviews = async (): Promise<Review[]> => {
  const response = await api.get('/reviews/user');
  return response.data;
};

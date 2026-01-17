import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  createReview,
  updateReview,
  deleteReview,
  fetchProductReviews,
  fetchUserReviews,
  clearReviews,
  selectReviews,
  selectUserReviews,
  selectReviewLoading,
  selectReviewError,
  selectReviewPagination,
} from '../store/review/reviewSlice';
import { CreateReviewData, UpdateReviewData, ReviewFilterParams, Review } from '../types';

export const useReviews = () => {
  const dispatch = useAppDispatch();
  const reviews = useAppSelector(selectReviews);
  const userReviews = useAppSelector(selectUserReviews);
  const loading = useAppSelector(selectReviewLoading);
  const error = useAppSelector(selectReviewError);
  const pagination = useAppSelector(selectReviewPagination);

  const loadProductReviews = useCallback(
    (productId: string, filters?: ReviewFilterParams) => {
      dispatch(fetchProductReviews({ productId, filters }));
    },
    [dispatch]
  );

  const loadUserReviews = useCallback(() => {
    dispatch(fetchUserReviews());
  }, [dispatch]);

  const submitReview = useCallback(
    async (data: CreateReviewData) => {
      const result = await dispatch(createReview(data));
      if (createReview.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload as string);
    },
    [dispatch]
  );

  const editReview = useCallback(
    async (reviewId: string, data: UpdateReviewData) => {
      const result = await dispatch(updateReview({ reviewId, data }));
      if (updateReview.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload as string);
    },
    [dispatch]
  );

  const removeReview = useCallback(
    async (reviewId: string) => {
      const result = await dispatch(deleteReview(reviewId));
      if (deleteReview.fulfilled.match(result)) {
        return;
      }
      throw new Error(result.payload as string);
    },
    [dispatch]
  );

  return {
    reviews,
    userReviews,
    loading,
    error,
    pagination,
    loadProductReviews,
    loadUserReviews,
    submitReview,
    editReview,
    removeReview,
    clearReviews: () => dispatch(clearReviews()),
  };
};

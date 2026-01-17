import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  fetchProducts,
  fetchProductById,
  fetchFeaturedProducts,
  fetchProductsByCategory,
  fetchCategories,
  setFilters,
  clearFilters,
  clearSelectedProduct,
  clearError,
} from '../store/product/productSlice';
import { ProductFilterParams } from '../types';

export const useProducts = () => {
  const dispatch = useAppDispatch();

  const {
    products,
    selectedProduct,
    categories,
    loading,
    error,
    filters,
    pagination,
  } = useAppSelector((state) => state.product);

  const loadProducts = useCallback(
    (filterParams?: ProductFilterParams) => {
      dispatch(fetchProducts(filterParams || filters));
    },
    [dispatch, filters]
  );

  const loadProductById = useCallback(
    (id: string) => {
      dispatch(fetchProductById(id));
    },
    [dispatch]
  );

  const loadFeaturedProducts = useCallback(() => {
    dispatch(fetchFeaturedProducts());
  }, [dispatch]);

  const loadProductsByCategory = useCallback(
    (categoryId: string, filterParams?: ProductFilterParams) => {
      dispatch(fetchProductsByCategory({ categoryId, filters: filterParams }));
    },
    [dispatch]
  );

  const loadCategories = useCallback(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const updateFilters = useCallback(
    (newFilters: Partial<ProductFilterParams>) => {
      dispatch(setFilters(newFilters as ProductFilterParams));
    },
    [dispatch]
  );

  const resetFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const handleClearSelectedProduct = useCallback(() => {
    dispatch(clearSelectedProduct());
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return useMemo(
    () => ({
      // State
      products,
      selectedProduct,
      categories,
      loading,
      error,
      filters,
      pagination,

      // Actions
      loadProducts,
      loadProductById,
      loadFeaturedProducts,
      loadProductsByCategory,
      loadCategories,
      updateFilters,
      resetFilters,
      clearSelectedProduct: handleClearSelectedProduct,
      clearError: handleClearError,
    }),
    [
      products,
      selectedProduct,
      categories,
      loading,
      error,
      filters,
      pagination,
      loadProducts,
      loadProductById,
      loadFeaturedProducts,
      loadProductsByCategory,
      loadCategories,
      updateFilters,
      resetFilters,
      handleClearSelectedProduct,
      handleClearError,
    ]
  );
};

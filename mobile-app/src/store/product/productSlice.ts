import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ProductState, Product, ProductFilterParams } from '../../types';
import * as productService from '../../services/product.service';

const initialState: ProductState = {
  products: [],
  selectedProduct: null,
  categories: [],
  loading: {
    fetch: false,
    refresh: false,
    loadMore: false,
    action: false,
    upload: false,
  },
  error: null,
  filters: {
    page: 1,
    pageSize: 10,
    search: '',
    categoryId: undefined,
    minPrice: 0,
    maxPrice: undefined,
    minRating: undefined,
    inStock: undefined,
    sortBy: 'newest',
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  },
};

export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async (filters: ProductFilterParams, { rejectWithValue }) => {
    try {
      const response = await productService.getProducts(filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch products');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'product/fetchProductById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await productService.getProductById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch product');
    }
  }
);

export const fetchFeaturedProducts = createAsyncThunk(
  'product/fetchFeaturedProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productService.getFeaturedProducts();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch featured products'
      );
    }
  }
);

export const fetchProductsByCategory = createAsyncThunk(
  'product/fetchProductsByCategory',
  async (
    { categoryId, filters }: { categoryId: string; filters?: ProductFilterParams },
    { rejectWithValue }
  ) => {
    try {
      const response = await productService.getProductsByCategory(categoryId, filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch products by category'
      );
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'product/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productService.getCategories();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch categories');
    }
  }
);

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<ProductFilterParams>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Products
    builder
      .addCase(fetchProducts.pending, (state, action) => {
        if (action.meta.arg.page === 1) {
          state.loading.fetch = true;
        } else {
          state.loading.loadMore = true;
        }
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.loading.loadMore = false;
        state.products = action.payload.products;
        state.pagination = {
          currentPage: action.payload.page,
          totalPages: Math.ceil(action.payload.total / action.payload.pageSize),
          totalItems: action.payload.total,
        };
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading.fetch = false;
        state.loading.loadMore = false;
        state.error = action.payload as string;
      });

    // Fetch Product By ID
    builder
      .addCase(fetchProductById.pending, (state) => {
        state.loading.fetch = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.payload as string;
      });

    // Fetch Featured Products
    builder
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.loading.fetch = true;
        state.error = null;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.products = action.payload;
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.payload as string;
      });

    // Fetch Products By Category
    builder
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.loading.fetch = true;
        state.error = null;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.products = action.payload.products;
        state.pagination = {
          currentPage: action.payload.page,
          totalPages: Math.ceil(action.payload.total / action.payload.pageSize),
          totalItems: action.payload.total,
        };
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.payload as string;
      });

    // Fetch Categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading.fetch = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearFilters, clearSelectedProduct, clearError } =
  productSlice.actions;

// Selectors
export const selectCategories = (state: any) => state.product.categories;
export const selectProductLoadingState = (state: any) => state.product.loading;
export const selectIsProductsLoading = (state: any) => 
  state.product.loading.fetch || state.product.loading.refresh;

export default productSlice.reducer;

import { prisma } from '../config/database';
import { CreateProductDTO, UpdateProductDTO, ProductFilterDTO, ProductResponse } from '../types';
import { cacheService } from './cache.service';
import { searchService } from './search.service';
import { searchAnalyticsService } from './search-analytics.service';
import logger from '../config/logger';
import crypto from 'crypto';

// TTL constants (in seconds)
const PRODUCT_DETAIL_TTL = 3600; // 1 hour
const PRODUCT_LIST_TTL = 600; // 10 minutes
const SEARCH_RESULTS_TTL = 300; // 5 minutes
const FEATURED_PRODUCTS_TTL = 1800; // 30 minutes
const CATEGORY_PRODUCTS_TTL = 900; // 15 minutes

export class ProductService {
  async createProduct(data: CreateProductDTO): Promise<ProductResponse> {
    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price.toString(),
        discountPrice: data.discountPrice?.toString(),
        images: data.images,
        categoryId: data.categoryId,
        stockQuantity: data.stockQuantity,
        weight: data.weight,
        unit: data.unit,
        isFeatured: data.isFeatured || false,
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    // Invalidate product list caches
    await cacheService.invalidateByTags(['products', 'product-list', 'featured', 'search']);

    return this.formatProductResponse(product);
  }

  async updateProduct(id: string, data: UpdateProductDTO): Promise<ProductResponse> {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Validate category if provided
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new Error('Category not found');
      }
    }

    // Validate stock
    if (data.stockQuantity !== undefined && data.stockQuantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price?.toString(),
        discountPrice: data.discountPrice?.toString(),
        images: data.images,
        categoryId: data.categoryId,
        stockQuantity: data.stockQuantity,
        weight: data.weight,
        unit: data.unit,
        isFeatured: data.isFeatured,
      },
      include: {
        category: true,
      },
    });

    // Invalidate product-specific and list caches
    await cacheService.invalidateByTags(['product', `product:${id}`, 'products', 'product-list', 'featured', 'search']);

    return this.formatProductResponse(updated);
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    // Invalidate product-specific and list caches
    await cacheService.invalidateByTags(['product', `product:${id}`, 'products', 'product-list', 'search']);
  }

  async getProductById(id: string): Promise<ProductResponse> {
    // Try to get from cache first
    const cacheKey = `product:${id}`;
    const cached = await cacheService.get<ProductResponse>(cacheKey);
    
    if (cached) {
      logger.debug('Product cache hit', { productId: id });
      return cached;
    }

    const product = await prisma.product.findFirst({
      where: { id, isActive: true },
      include: {
        category: true,
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const response = this.formatProductResponse(product);

    // Cache the result
    await cacheService.set(cacheKey, response, {
      ttl: PRODUCT_DETAIL_TTL,
      tags: ['product', `product:${id}`, `category:${product.categoryId}`],
    });

    return response;
  }

  async getAllProducts(filters: ProductFilterDTO): Promise<{
    products: ProductResponse[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      categoryId = null,
      minPrice = 0,
      maxPrice,
      sortBy = 'newest',
      inStock,
      minRating,
    } = filters;

    // Use full-text search for search terms longer than 2 characters
    if (search && search.trim().length > 2) {
      return this.searchProducts(search, filters);
    }

    // Generate cache key based on filters
    const filterHash = crypto.createHash('md5').update(JSON.stringify(filters)).digest('hex');
    const cacheKey = `products:list:${filterHash}`;

    // Try to get from cache first
    const cached = await cacheService.get<{
      products: ProductResponse[];
      total: number;
      page: number;
      pageSize: number;
    }>(cacheKey);

    if (cached) {
      logger.debug('Product list cache hit', { filters });
      return cached;
    }

    const skip = (page - 1) * pageSize;

    // Build filter conditions
    const where: any = {
      isActive: true,
    };

    if (search && search.trim().length <= 2) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Price filtering - only add constraints if values are provided and valid
    const priceFilter: any = {};
    if (minPrice !== undefined && minPrice > 0) {
      priceFilter.gte = minPrice.toString();
    }
    if (maxPrice !== undefined && maxPrice !== Infinity && !isNaN(maxPrice)) {
      priceFilter.lte = maxPrice.toString();
    }
    if (Object.keys(priceFilter).length > 0) {
      where.price = priceFilter;
    }

    // Stock filtering
    if (inStock === true) {
      where.stockQuantity = { gt: 0 };
    }

    // Rating filtering
    if (minRating !== undefined && minRating > 0) {
      where.averageRating = { gte: minRating.toString() };
    }

    // Build sort order
    let orderBy: any = { createdAt: 'desc' };

    switch (sortBy) {
      case 'price-asc':
        orderBy = { price: 'asc' };
        break;
      case 'price-desc':
        orderBy = { price: 'desc' };
        break;
      case 'rating':
        orderBy = { averageRating: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    const result = {
      products: products.map((p) => this.formatProductResponse(p)),
      total,
      page,
      pageSize,
    };

    // Cache the result
    const tags = categoryId ? ['products', 'product-list', `category:${categoryId}`] : ['products', 'product-list'];
    await cacheService.set(cacheKey, result, {
      ttl: PRODUCT_LIST_TTL,
      tags,
    });

    return result;
  }

  private async searchProducts(search: string, filters: ProductFilterDTO): Promise<{
    products: ProductResponse[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const {
      page = 1,
      pageSize = 10,
      categoryId = null,
      minPrice = 0,
      maxPrice,
      inStock,
      minRating,
    } = filters;

    // Generate cache key for search results
    const filterHash = crypto.createHash('md5').update(JSON.stringify({ search, ...filters })).digest('hex');
    const cacheKey = `search:results:${filterHash}`;

    // Try to get from cache first with shorter TTL for search results
    const cached = await cacheService.get<{
      products: ProductResponse[];
      total: number;
      page: number;
      pageSize: number;
    }>(cacheKey);

    if (cached) {
      logger.debug('Search results cache hit', { search, filters });
      return cached;
    }

    const skip = (page - 1) * pageSize;

    // Use search service for full-text search
    const { results: searchResults, total } = await searchService.searchProducts(search, {
      categoryId: categoryId || undefined,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      limit: pageSize,
      offset: skip,
    });

    // Track search analytics
    await searchAnalyticsService.trackSearch(
      search,
      total,
      filters.userId || undefined
    );

    const result = {
      products: searchResults.map((p) => this.formatProductResponse(p)),
      total,
      page,
      pageSize,
    };

    // Cache search results with shorter TTL
    const tags = categoryId ? ['products', 'search', `category:${categoryId}`] : ['products', 'search'];
    await cacheService.set(cacheKey, result, {
      ttl: SEARCH_RESULTS_TTL,
      tags,
    });

    return result;
  }

  async getFeaturedProducts(): Promise<ProductResponse[]> {
    const cacheKey = 'products:featured';

    // Try to get from cache first
    const cached = await cacheService.get<ProductResponse[]>(cacheKey);

    if (cached) {
      logger.debug('Featured products cache hit');
      return cached;
    }

    const products = await prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true,
      },
      include: {
        category: true,
      },
      take: 10,
    });

    const result = products.map((p) => this.formatProductResponse(p));

    // Get unique category IDs for tagging
    const categoryTags = [...new Set(products.map(p => `category:${p.categoryId}`))];

    // Cache the result
    await cacheService.set(cacheKey, result, {
      ttl: FEATURED_PRODUCTS_TTL,
      tags: ['products', 'featured', ...categoryTags],
    });

    return result;
  }

  async getProductsByCategory(categoryId: string): Promise<ProductResponse[]> {
    const cacheKey = `products:category:${categoryId}`;

    // Try to get from cache first
    const cached = await cacheService.get<ProductResponse[]>(cacheKey);

    if (cached) {
      logger.debug('Category products cache hit', { categoryId });
      return cached;
    }

    const products = await prisma.product.findMany({
      where: {
        categoryId,
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const result = products.map((p) => this.formatProductResponse(p));

    // Cache the result
    await cacheService.set(cacheKey, result, {
      ttl: CATEGORY_PRODUCTS_TTL,
      tags: ['products', `category:${categoryId}`],
    });

    return result;
  }

  async updateProductStock(id: string, quantity: number): Promise<ProductResponse> {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const newQuantity = product.stockQuantity + quantity;

    if (newQuantity < 0) {
      throw new Error('Insufficient stock');
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        stockQuantity: newQuantity,
      },
      include: {
        category: true,
      },
    });

    // Invalidate product cache including list/featured caches for in-stock filtering
    await cacheService.invalidateByTags(['product', `product:${id}`, 'products', 'product-list', 'featured', 'search']);

    return this.formatProductResponse(updated);
  }

  async updateProductRating(productId: string): Promise<void> {
    const reviews = await prisma.review.findMany({
      where: { productId },
    });

    if (reviews.length === 0) {
      await prisma.product.update({
        where: { id: productId },
        data: {
          averageRating: 0,
          totalReviews: 0,
        },
      });

      // Invalidate product cache
      await cacheService.invalidateByTags(['product', `product:${productId}`, 'products', 'search']);
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalReviews: reviews.length,
      },
    });

    // Invalidate product cache
    await cacheService.invalidateByTags(['product', `product:${productId}`, 'products', 'search']);
  }

  private formatProductResponse(product: any): ProductResponse {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice,
      images: product.images,
      category: {
        id: product.category.id,
        name: product.category.name,
      },
      stockQuantity: product.stockQuantity,
      weight: product.weight,
      unit: product.unit,
      isFeatured: product.isFeatured,
      averageRating: product.averageRating.toString(),
      totalReviews: product.totalReviews,
      variants: product.variants?.map((v: any) => ({
        id: v.id,
        productId: v.productId,
        sku: v.sku,
        name: v.name,
        attributes: v.attributes,
        price: v.price?.toString(),
        discountPrice: v.discountPrice?.toString(),
        stockQuantity: v.stockQuantity,
        lowStockThreshold: v.lowStockThreshold,
        isActive: v.isActive,
        sortOrder: v.sortOrder,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}

export const productService = new ProductService();

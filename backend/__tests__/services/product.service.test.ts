// @ts-nocheck
import { ProductService } from '../../src/services/product.service';
import { prismaMock } from '../mocks/prisma.mock';
import { createMockProduct, createMockCategory, createMockReview } from '../helpers/test-data';
import { Decimal } from '@prisma/client/runtime/library';

// Mock search service
jest.mock('../../src/services/search.service', () => ({
  searchService: {
    searchProducts: jest.fn(),
  },
}));

import { searchService } from '../../src/services/search.service';

// Helper to create product with category relation
const createMockProductWithCategory = (productOverrides?: any, categoryOverrides?: any) => {
  const category = createMockCategory(categoryOverrides);
  const product = createMockProduct(productOverrides);
  return { ...product, category };
};

describe('ProductService', () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
    jest.clearAllMocks();
  });

  describe('createProduct()', () => {
    const productData = {
      name: 'New Product',
      description: 'New product description',
      price: '99.99',
      categoryId: 'category-1',
      images: ['https://example.com/image1.jpg'],
      stockQuantity: 100,
      unit: 'KG' as const,
    };

    it('should successfully create product with valid category', async () => {
      const mockCategory = createMockCategory();
      const mockProduct = createMockProduct({
        name: productData.name,
        price: new Decimal(productData.price),
      });

      prismaMock.category.findUnique.mockResolvedValue(mockCategory);
      prismaMock.product.create.mockResolvedValue({
        ...mockProduct,
        category: mockCategory,
      } as any);

      const result = await productService.createProduct(productData);

      expect(prismaMock.category.findUnique).toHaveBeenCalledWith({
        where: { id: productData.categoryId },
      });
      expect(prismaMock.product.create).toHaveBeenCalledWith({
        data: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          categoryId: productData.categoryId,
          images: productData.images,
          stockQuantity: productData.stockQuantity,
          unit: productData.unit,
          isFeatured: false,
          isActive: true,
        },
        include: { category: true },
      });
      expect(result.name).toBe(productData.name);
    });

    it('should throw error when category does not exist', async () => {
      prismaMock.category.findUnique.mockResolvedValue(null);

      await expect(productService.createProduct(productData))
        .rejects.toThrow('Category not found');
    });

    it('should convert price to string for Prisma Decimal', async () => {
      const mockCategory = createMockCategory();
      const mockProduct = createMockProduct();

      prismaMock.category.findUnique.mockResolvedValue(mockCategory);
      prismaMock.product.create.mockResolvedValue({
        ...mockProduct,
        category: mockCategory,
      } as any);

      await productService.createProduct(productData);

      expect(prismaMock.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            price: '99.99',
          }),
        })
      );
    });

    it('should set default values for isFeatured and isActive', async () => {
      const mockCategory = createMockCategory();
      const mockProduct = createMockProduct();

      prismaMock.category.findUnique.mockResolvedValue(mockCategory);
      prismaMock.product.create.mockResolvedValue({
        ...mockProduct,
        category: mockCategory,
      } as any);

      await productService.createProduct(productData);

      expect(prismaMock.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isFeatured: false,
            isActive: true,
          }),
        })
      );
    });

    it('should create product with all optional fields', async () => {
      const fullProductData = {
        ...productData,
        discountPrice: '79.99',
        isFeatured: true,
        unit: 'KG' as const,
      };

      const mockCategory = createMockCategory();
      const mockProduct = createMockProduct({
        discountPrice: new Decimal('79.99'),
        isFeatured: true,
      });

      prismaMock.category.findUnique.mockResolvedValue(mockCategory);
      prismaMock.product.create.mockResolvedValue({
        ...mockProduct,
        category: mockCategory,
      } as any);

      const result = await productService.createProduct(fullProductData);

      expect(prismaMock.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            discountPrice: '79.99',
            isFeatured: true,
          }),
        })
      );
    });
  });

  describe('updateProduct()', () => {
    const updateData = {
      name: 'Updated Product',
      price: '119.99',
    };

    it('should successfully update product', async () => {
      const existingProduct = createMockProduct();
      const mockCategory = createMockCategory();
      const updatedProduct = createMockProductWithCategory({
        name: updateData.name,
        price: new Decimal(updateData.price),
      });

      prismaMock.product.findUnique.mockResolvedValue(existingProduct);
      prismaMock.product.update.mockResolvedValue(updatedProduct);

      const result = await productService.updateProduct('product-1', updateData);

      expect(prismaMock.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-1' },
      });
      expect(prismaMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product-1' },
          include: expect.objectContaining({ category: true }),
        })
      );
      expect(result.name).toBe(updateData.name);
    });

    it('should throw error when product not found', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await expect(productService.updateProduct('non-existent', updateData))
        .rejects.toThrow('Product not found');
    });

    it('should throw error when new category does not exist', async () => {
      const existingProduct = createMockProduct();
      prismaMock.product.findUnique.mockResolvedValue(existingProduct);
      prismaMock.category.findUnique.mockResolvedValue(null);

      await expect(
        productService.updateProduct('product-1', { categoryId: 'invalid-category' })
      ).rejects.toThrow('Category not found');
    });

    it('should reject negative stock quantity', async () => {
      const existingProduct = createMockProduct();
      prismaMock.product.findUnique.mockResolvedValue(existingProduct);

      await expect(
        productService.updateProduct('product-1', { stockQuantity: -1 })
      ).rejects.toThrow('Stock quantity cannot be negative');
    });

    it('should handle partial updates', async () => {
      const existingProduct = createMockProduct();
      const partialUpdate = { name: 'Only Name Updated' };

      prismaMock.product.findUnique.mockResolvedValue(existingProduct);
      prismaMock.product.update.mockResolvedValue(
        createMockProductWithCategory({ name: partialUpdate.name })
      );

      const result = await productService.updateProduct('product-1', partialUpdate);

      expect(prismaMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: partialUpdate,
        })
      );
    });

    it('should convert price and discountPrice to string', async () => {
      const existingProduct = createMockProduct();
      const priceUpdate = {
        price: '149.99',
        discountPrice: '129.99',
      };

      prismaMock.product.findUnique.mockResolvedValue(existingProduct);
      prismaMock.product.update.mockResolvedValue(createMockProductWithCategory());

      await productService.updateProduct('product-1', priceUpdate);

      expect(prismaMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            price: '149.99',
            discountPrice: '129.99',
          }),
        })
      );
    });
  });

  describe('deleteProduct()', () => {
    it('should soft delete product by setting isActive to false', async () => {
      const existingProduct = createMockProduct();
      prismaMock.product.findUnique.mockResolvedValue(existingProduct);
      prismaMock.product.update.mockResolvedValue(
        createMockProduct({ isActive: false })
      );

      await productService.deleteProduct('product-1');

      expect(prismaMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product-1' },
          data: expect.objectContaining({ isActive: false }),
        })
      );
      expect(prismaMock.product.delete).not.toHaveBeenCalled();
    });

    it('should throw error when product not found', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await expect(productService.deleteProduct('non-existent'))
        .rejects.toThrow('Product not found');
    });
  });

  describe('getProductById()', () => {
    it('should successfully retrieve product with category relation', async () => {
      const mockProduct = createMockProductWithCategory();
      prismaMock.product.findFirst.mockResolvedValue(mockProduct);

      const result = await productService.getProductById('product-1');

      expect(prismaMock.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'product-1',
            isActive: true,
          },
          include: expect.objectContaining({ category: true }),
        })
      );
      expect(result).toMatchObject({
        id: mockProduct.id,
        name: mockProduct.name,
        price: mockProduct.price,
      });
    });

    it('should throw error when product not found', async () => {
      prismaMock.product.findFirst.mockResolvedValue(null);

      await expect(productService.getProductById('non-existent'))
        .rejects.toThrow('Product not found');
    });

    it('should filter by isActive: true', async () => {
      const mockProduct = createMockProductWithCategory();
      prismaMock.product.findFirst.mockResolvedValue(mockProduct);

      await productService.getProductById('product-1');

      expect(prismaMock.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });
  });

  describe('getAllProducts()', () => {
    it('should handle pagination correctly', async () => {
      const mockProducts = [createMockProductWithCategory(), createMockProductWithCategory({ id: 'product-2' })];
      prismaMock.product.findMany.mockResolvedValue(mockProducts);
      prismaMock.product.count.mockResolvedValue(25);

      const result = await productService.getAllProducts({ page: 2, pageSize: 10 });

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBe(25);
    });

    it('should filter by search query in name and description', async () => {
      const mockProducts = [createMockProductWithCategory()];
      
      // Mock searchService to return results array
      searchService.searchProducts.mockResolvedValue({
        results: mockProducts,
        total: 1,
      });

      const result = await productService.getAllProducts({ search: 'test' });

      expect(searchService.searchProducts).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          limit: 10,
          offset: 0,
        })
      );
      expect(result.products).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by category', async () => {
      const mockProducts = [createMockProductWithCategory()];
      prismaMock.product.findMany.mockResolvedValue(mockProducts);
      prismaMock.product.count.mockResolvedValue(1);

      await productService.getAllProducts({ categoryId: 'category-1' });

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'category-1',
          }),
        })
      );
    });

    it('should filter by price range', async () => {
      const mockProducts = [createMockProductWithCategory()];
      prismaMock.product.findMany.mockResolvedValue(mockProducts);
      prismaMock.product.count.mockResolvedValue(1);

      await productService.getAllProducts({ minPrice: 50, maxPrice: 150 });

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: {
              gte: '50',
              lte: '150',
            },
          }),
        })
      );
    });

    it('should filter by stock availability', async () => {
      const mockProducts = [createMockProductWithCategory()];
      prismaMock.product.findMany.mockResolvedValue(mockProducts);
      prismaMock.product.count.mockResolvedValue(1);

      await productService.getAllProducts({ inStock: true });

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stockQuantity: { gt: 0 },
          }),
        })
      );
    });

    it('should filter by minimum rating', async () => {
      const mockProducts = [createMockProductWithCategory()];
      prismaMock.product.findMany.mockResolvedValue(mockProducts);
      prismaMock.product.count.mockResolvedValue(1);

      await productService.getAllProducts({ minRating: 4 });

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            averageRating: { gte: '4' },
          }),
        })
      );
    });

    it('should sort by newest', async () => {
      const mockProducts = [createMockProductWithCategory()];
      prismaMock.product.findMany.mockResolvedValue(mockProducts);
      prismaMock.product.count.mockResolvedValue(1);

      await productService.getAllProducts({ sortBy: 'newest' });

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should sort by price ascending', async () => {
      const mockProducts = [createMockProductWithCategory()];
      prismaMock.product.findMany.mockResolvedValue(mockProducts);
      prismaMock.product.count.mockResolvedValue(1);

      await productService.getAllProducts({ sortBy: 'price-asc' });

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'asc' },
        })
      );
    });

    it('should sort by price descending', async () => {
      const mockProducts = [createMockProductWithCategory()];
      prismaMock.product.findMany.mockResolvedValue(mockProducts);
      prismaMock.product.count.mockResolvedValue(1);

      await productService.getAllProducts({ sortBy: 'price-desc' });

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'desc' },
        })
      );
    });

    it('should sort by rating', async () => {
      const mockProducts = [createMockProductWithCategory()];
      prismaMock.product.findMany.mockResolvedValue(mockProducts);
      prismaMock.product.count.mockResolvedValue(1);

      await productService.getAllProducts({ sortBy: 'rating' });

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { averageRating: 'desc' },
        })
      );
    });

    it('should return correct response structure with pagination metadata', async () => {
      const mockProducts = [createMockProductWithCategory()];
      prismaMock.product.findMany.mockResolvedValue(mockProducts);
      prismaMock.product.count.mockResolvedValue(50);

      const result = await productService.getAllProducts({ page: 1, pageSize: 10 });

      expect(result).toMatchObject({
        total: 50,
        page: 1,
        pageSize: 10,
      });
      expect(result.products).toHaveLength(mockProducts.length);
    });
  });

  describe('getFeaturedProducts()', () => {
    it('should retrieve featured products only', async () => {
      const mockProducts = [
        createMockProductWithCategory({ isFeatured: true }),
        createMockProductWithCategory({ id: 'product-2', isFeatured: true }),
      ];
      prismaMock.product.findMany.mockResolvedValue(mockProducts);

      const result = await productService.getFeaturedProducts();

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            isFeatured: true,
          },
          include: expect.objectContaining({ category: true }),
          take: 10,
        })
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'product-1',
        isFeatured: true,
      });
      expect(result[1]).toMatchObject({
        id: 'product-2',
        isFeatured: true,
      });
    });

    it('should limit to 10 products', async () => {
      prismaMock.product.findMany.mockResolvedValue([]);

      await productService.getFeaturedProducts();

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('should filter by isActive and isFeatured', async () => {
      prismaMock.product.findMany.mockResolvedValue([]);

      await productService.getFeaturedProducts();

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            isFeatured: true,
          },
        })
      );
    });
  });

  describe('updateProductStock()', () => {
    it('should increment stock', async () => {
      const existingProduct = createMockProduct({ stockQuantity: 100 });
      const updatedProduct = createMockProductWithCategory({ stockQuantity: 110 });

      prismaMock.product.findUnique.mockResolvedValue(existingProduct);
      prismaMock.product.update.mockResolvedValue(updatedProduct);

      const result = await productService.updateProductStock('product-1', 10);

      expect(prismaMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product-1' },
          data: expect.objectContaining({
            stockQuantity: 110,
          }),
        })
      );
      expect(result.stockQuantity).toBe(110);
    });

    it('should decrement stock', async () => {
      const existingProduct = createMockProduct({ stockQuantity: 100 });
      const updatedProduct = createMockProductWithCategory({ stockQuantity: 90 });

      prismaMock.product.findUnique.mockResolvedValue(existingProduct);
      prismaMock.product.update.mockResolvedValue(updatedProduct);

      const result = await productService.updateProductStock('product-1', -10);

      expect(prismaMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product-1' },
          data: expect.objectContaining({
            stockQuantity: 90,
          }),
        })
      );
    });

    it('should throw error when resulting stock would be negative', async () => {
      const existingProduct = createMockProduct({ stockQuantity: 5 });
      prismaMock.product.findUnique.mockResolvedValue(existingProduct);

      await expect(productService.updateProductStock('product-1', -10))
        .rejects.toThrow('Insufficient stock');
    });

    it('should throw error when product not found', async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await expect(productService.updateProductStock('non-existent', 10))
        .rejects.toThrow('Product not found');
    });
  });

  describe('updateProductRating()', () => {
    it('should calculate average rating from reviews', async () => {
      const mockReviews = [
        createMockReview({ rating: 5 }),
        createMockReview({ id: 'review-2', rating: 4 }),
        createMockReview({ id: 'review-3', rating: 5 }),
      ];
      prismaMock.review.findMany.mockResolvedValue(mockReviews);
      prismaMock.product.update.mockResolvedValue(
        createMockProduct({
          averageRating: new Decimal('4.67'),
          totalReviews: 3,
        })
      );

      await productService.updateProductRating('product-1');

      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: {
          averageRating: expect.any(Number),
          totalReviews: 3,
        },
      });
    });

    it('should set rating to 0 when no reviews exist', async () => {
      prismaMock.review.findMany.mockResolvedValue([]);
      prismaMock.product.update.mockResolvedValue(
        createMockProduct({
          averageRating: new Decimal('0'),
          totalReviews: 0,
        })
      );

      await productService.updateProductRating('product-1');

      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: {
          averageRating: 0,
          totalReviews: 0,
        },
      });
    });

    it('should update totalReviews count', async () => {
      const mockReviews = [
        createMockReview(),
        createMockReview({ id: 'review-2' }),
      ];
      prismaMock.review.findMany.mockResolvedValue(mockReviews);
      prismaMock.product.update.mockResolvedValue(
        createMockProduct({ totalReviews: 2 })
      );

      await productService.updateProductRating('product-1');

      expect(prismaMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalReviews: 2,
          }),
        })
      );
    });
  });
});

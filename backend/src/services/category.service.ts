import { prisma } from '../config/database';
import { CreateCategoryDTO, UpdateCategoryDTO, CategoryResponse } from '../types';
import { cacheService } from './cache.service';
import logger from '../config/logger';

// TTL constants (in seconds)
const CATEGORY_TTL = 3600; // 1 hour

export class CategoryService {
  async createCategory(data: CreateCategoryDTO): Promise<CategoryResponse> {
    // Check if category name already exists
    const existing = await prisma.category.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new Error('Category name already exists');
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        isActive: true,
      },
    });

    // Invalidate categories list cache
    await cacheService.invalidateByTags(['categories']);

    return this.formatCategoryResponse(category);
  }

  async updateCategory(id: string, data: UpdateCategoryDTO): Promise<CategoryResponse> {
    // Find category by id
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Check name uniqueness if name is being updated
    if (data.name && data.name !== category.name) {
      const existing = await prisma.category.findUnique({
        where: { name: data.name },
      });

      if (existing) {
        throw new Error('Category name already exists');
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
      },
    });

    // Invalidate category-specific and list caches, plus product caches that embed category data
    await cacheService.invalidateByTags(['category', `category:${id}`, 'categories', 'products', 'product-list', 'featured']);

    return this.formatCategoryResponse(updated);
  }

  async deleteCategory(id: string): Promise<void> {
    // Find category
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    // Soft delete by setting isActive to false
    await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });

    // Invalidate category-specific and list caches, plus product caches that embed category data
    await cacheService.invalidateByTags(['category', `category:${id}`, 'categories', 'products', 'product-list', 'featured']);
  }

  async getCategoryById(id: string): Promise<CategoryResponse> {
    const cacheKey = `category:${id}`;

    // Try to get from cache first
    const cached = await cacheService.get<CategoryResponse>(cacheKey);

    if (cached) {
      logger.debug('Category cache hit', { categoryId: id });
      return cached;
    }

    const category = await prisma.category.findFirst({
      where: { id, isActive: true },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const response = this.formatCategoryResponse(category);

    // Cache the result
    await cacheService.set(cacheKey, response, {
      ttl: CATEGORY_TTL,
      tags: ['category', `category:${id}`],
    });

    return response;
  }

  async getAllCategories(): Promise<CategoryResponse[]> {
    const cacheKey = 'categories:all';

    // Try to get from cache first
    const cached = await cacheService.get<CategoryResponse[]>(cacheKey);

    if (cached) {
      logger.debug('Categories list cache hit');
      return cached;
    }

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const result = categories.map((cat) => this.formatCategoryResponse(cat));

    // Cache the result
    await cacheService.set(cacheKey, result, {
      ttl: CATEGORY_TTL,
      tags: ['categories'],
    });

    return result;
  }

  private formatCategoryResponse(category: any): CategoryResponse {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}

export const categoryService = new CategoryService();

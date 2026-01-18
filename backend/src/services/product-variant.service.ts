import { prisma } from '../config/database';
import { CreateProductVariantDTO, UpdateProductVariantDTO, ProductVariantResponse } from '../types';
import { cacheService } from './cache.service';
import logger from '../config/logger';

export class ProductVariantService {
  async createVariant(data: CreateProductVariantDTO): Promise<ProductVariantResponse> {
    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Validate SKU is unique
    const existingSku = await prisma.productVariant.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      throw new Error('SKU already exists');
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId: data.productId,
        sku: data.sku,
        name: data.name,
        attributes: data.attributes,
        price: data.price?.toString(),
        discountPrice: data.discountPrice?.toString(),
        stockQuantity: data.stockQuantity,
        lowStockThreshold: data.lowStockThreshold || 5,
        sortOrder: data.sortOrder || 0,
      },
    });

    // Invalidate product cache
    await cacheService.invalidateByTags(['product', `product:${data.productId}`, 'products']);

    logger.info(`Variant created: ${variant.id} for product ${data.productId}`);
    return this.formatVariantResponse(variant);
  }

  async updateVariant(id: string, data: UpdateProductVariantDTO): Promise<ProductVariantResponse> {
    const variant = await prisma.productVariant.findUnique({
      where: { id },
    });

    if (!variant) {
      throw new Error('Variant not found');
    }

    // Validate SKU uniqueness if updating
    if (data.sku && data.sku !== variant.sku) {
      const existingSku = await prisma.productVariant.findUnique({
        where: { sku: data.sku },
      });

      if (existingSku) {
        throw new Error('SKU already exists');
      }
    }

    const updated = await prisma.productVariant.update({
      where: { id },
      data: {
        sku: data.sku,
        name: data.name,
        attributes: data.attributes,
        price: data.price?.toString(),
        discountPrice: data.discountPrice?.toString(),
        stockQuantity: data.stockQuantity,
        lowStockThreshold: data.lowStockThreshold,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });

    // Invalidate caches
    await cacheService.invalidateByTags(['product', `product:${variant.productId}`, 'products']);

    logger.info(`Variant updated: ${id}`);
    return this.formatVariantResponse(updated);
  }

  async deleteVariant(id: string): Promise<void> {
    const variant = await prisma.productVariant.findUnique({
      where: { id },
    });

    if (!variant) {
      throw new Error('Variant not found');
    }

    // Soft delete by setting isActive to false
    await prisma.productVariant.update({
      where: { id },
      data: { isActive: false },
    });

    // Invalidate caches
    await cacheService.invalidateByTags(['product', `product:${variant.productId}`, 'products']);

    logger.info(`Variant deleted: ${id}`);
  }

  async getVariantsByProduct(productId: string): Promise<ProductVariantResponse[]> {
    const variants = await prisma.productVariant.findMany({
      where: { productId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return variants.map(v => this.formatVariantResponse(v));
  }

  async getVariantById(id: string): Promise<ProductVariantResponse> {
    const variant = await prisma.productVariant.findFirst({
      where: { id, isActive: true },
    });

    if (!variant) {
      throw new Error('Variant not found');
    }

    return this.formatVariantResponse(variant);
  }

  async checkLowStock(productId: string): Promise<ProductVariantResponse[]> {
    const variants = await prisma.productVariant.findMany({
      where: {
        productId,
        isActive: true,
      },
    });

    // Filter variants where stockQuantity <= lowStockThreshold
    const lowStockVariants = variants.filter(
      v => v.stockQuantity <= v.lowStockThreshold
    );

    return lowStockVariants.map(v => this.formatVariantResponse(v));
  }

  private formatVariantResponse(variant: any): ProductVariantResponse {
    return {
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      name: variant.name,
      attributes: variant.attributes as Record<string, string>,
      price: variant.price?.toString(),
      discountPrice: variant.discountPrice?.toString(),
      stockQuantity: variant.stockQuantity,
      lowStockThreshold: variant.lowStockThreshold,
      isActive: variant.isActive,
      sortOrder: variant.sortOrder,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    };
  }
}

export const productVariantService = new ProductVariantService();

import { prisma } from '../config/database';
import { ProductResponse, WishlistResponse, WishlistItemResponse } from '../types';

class WishlistService {
  private mapProduct(product: any): ProductResponse {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      discountPrice: product.discountPrice ? product.discountPrice.toString() : undefined,
      images: product.images,
      category: {
        id: product.category.id,
        name: product.category.name,
      },
      stockQuantity: product.stockQuantity,
      weight: product.weight ?? undefined,
      unit: product.unit,
      isFeatured: product.isFeatured,
      averageRating: Number(product.averageRating),
      totalReviews: product.totalReviews,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private formatWishlistResponse(items: any[]): WishlistResponse {
    const mappedItems: WishlistItemResponse[] = items.map((item) => ({
      id: item.id,
      productId: item.productId,
      product: this.mapProduct(item.product),
      createdAt: item.createdAt,
    }));

    return {
      items: mappedItems,
      totalItems: mappedItems.length,
    };
  }

  async getWishlist(userId: string): Promise<WishlistResponse> {
    const items = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.formatWishlistResponse(items);
  }

  async addToWishlist(userId: string, productId: string): Promise<WishlistResponse> {
    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
      include: { category: true },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      throw new Error('Product already in wishlist');
    }

    await prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
    });

    return this.getWishlist(userId);
  }

  async removeFromWishlist(userId: string, productId: string): Promise<WishlistResponse> {
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!existing) {
      throw new Error('Wishlist item not found');
    }

    await prisma.wishlist.delete({
      where: { id: existing.id },
    });

    return this.getWishlist(userId);
  }

  async isInWishlist(userId: string, productId: string): Promise<{ inWishlist: boolean }> {
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    return { inWishlist: Boolean(existing) };
  }

  async clearWishlist(userId: string): Promise<void> {
    await prisma.wishlist.deleteMany({ where: { userId } });
  }
}

export const wishlistService = new WishlistService();

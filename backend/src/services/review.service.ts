import { prisma } from '../config/database';
import { CreateReviewDTO, UpdateReviewDTO, ModerateReviewDTO, ReviewResponse } from '../types';
import { productService } from './product.service';

export class ReviewService {
  async createReview(userId: string, data: CreateReviewDTO): Promise<ReviewResponse> {
    // Verify order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: data.orderId,
        userId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Verify order is delivered
    if (order.status !== 'DELIVERED') {
      throw new Error('Can only review delivered orders');
    }

    // Verify product exists in order
    const orderItem = order.items.find((item) => item.productId === data.productId);
    if (!orderItem) {
      throw new Error('Product not found in this order');
    }

    // Check if review already exists for this user-product-order combination
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        productId: data.productId,
        orderId: data.orderId,
      },
    });

    if (existingReview) {
      throw new Error('You have already reviewed this product for this order');
    }

    const review = await prisma.review.create({
      data: {
        userId,
        productId: data.productId,
        orderId: data.orderId,
        rating: data.rating,
        title: data.title || '',
        comment: data.comment || '',
        images: data.images || [],
        isVerifiedPurchase: true,
        moderationStatus: 'PENDING',
      },
      include: {
        user: true,
      },
    });

    // Recalculate product rating
    await productService.updateProductRating(data.productId);

    return this.formatReviewResponse(review);
  }

  async updateReview(userId: string, reviewId: string, data: UpdateReviewDTO): Promise<ReviewResponse> {
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        userId,
      },
    });

    if (!review) {
      throw new Error('Review not found or you do not have permission to update it');
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: data.rating !== undefined ? data.rating : review.rating,
        title: data.title !== undefined ? data.title : review.title,
        comment: data.comment !== undefined ? data.comment : review.comment,
        images: data.images !== undefined ? data.images : review.images,
      },
      include: {
        user: true,
      },
    });

    // Recalculate product rating
    await productService.updateProductRating(review.productId);

    return this.formatReviewResponse(updated);
  }

  async deleteReview(userId: string, reviewId: string): Promise<void> {
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        userId,
      },
    });

    if (!review) {
      throw new Error('Review not found or you do not have permission to delete it');
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Recalculate product rating
    await productService.updateProductRating(review.productId);
  }

  async getReviewsByProduct(
    productId: string,
    filters?: {
      page?: number;
      pageSize?: number;
      sortBy?: 'newest' | 'helpful' | 'rating-high' | 'rating-low';
    }
  ): Promise<{
    reviews: ReviewResponse[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { page = 1, pageSize = 10, sortBy = 'newest' } = filters || {};
    const skip = (page - 1) * pageSize;

    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'helpful':
        orderBy = { helpfulCount: 'desc' };
        break;
      case 'rating-high':
        orderBy = { rating: 'desc' };
        break;
      case 'rating-low':
        orderBy = { rating: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          productId,
          moderationStatus: 'APPROVED',
        },
        include: {
          user: true,
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.review.count({
        where: {
          productId,
          moderationStatus: 'APPROVED',
        },
      }),
    ]);

    return {
      reviews: reviews.map((r) => this.formatReviewResponse(r)),
      total,
      page,
      pageSize,
    };
  }

  async getReviewsByUser(userId: string): Promise<ReviewResponse[]> {
    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((r) => this.formatReviewResponse(r));
  }

  async moderateReview(reviewId: string, moderationData: ModerateReviewDTO): Promise<ReviewResponse> {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: true,
      },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    const statusChanged = review.moderationStatus !== moderationData.moderationStatus;

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        isModerated: true,
        moderationStatus: moderationData.moderationStatus,
        moderationNote: moderationData.moderationNote || null,
      },
      include: {
        user: true,
      },
    });

    // Recalculate product rating if status changed
    if (statusChanged) {
      await productService.updateProductRating(review.productId);
    }

    return this.formatReviewResponse(updated);
  }

  async getPendingReviews(filters?: {
    page?: number;
    pageSize?: number;
  }): Promise<{
    reviews: ReviewResponse[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { page = 1, pageSize = 10 } = filters || {};
    const skip = (page - 1) * pageSize;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          moderationStatus: 'PENDING',
        },
        include: {
          user: true,
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
      }),
      prisma.review.count({
        where: {
          moderationStatus: 'PENDING',
        },
      }),
    ]);

    return {
      reviews: reviews.map((r) => this.formatReviewResponse(r)),
      total,
      page,
      pageSize,
    };
  }

  private formatReviewResponse(review: any): ReviewResponse {
    return {
      id: review.id,
      userId: review.userId,
      userName: `${review.user.firstName} ${review.user.lastName}`,
      productId: review.productId,
      orderId: review.orderId,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images,
      isVerifiedPurchase: review.isVerifiedPurchase,
      moderationStatus: review.moderationStatus,
      helpfulCount: review.helpfulCount,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}

export const reviewService = new ReviewService();

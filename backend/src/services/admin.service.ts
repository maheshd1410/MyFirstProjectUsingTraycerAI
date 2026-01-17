import { PrismaClient, Prisma } from '@prisma/client';
import { cacheService } from './cache.service';
import logger from '../config/logger';
import { productViewService } from './product-view.service';

const prisma = new PrismaClient();

export const adminService = {
  getAllOrders: async (filters: {
    page: number;
    pageSize: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    const { page, pageSize, status, startDate, endDate, search } = filters;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (status && status !== 'All') {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (search) {
      where.orderNumber = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          items: true,
          address: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / pageSize),
        pageSize,
        total,
      },
    };
  },

  getAllUsers: async (filters: {
    page: number;
    pageSize: number;
    role?: string;
    isActive?: boolean;
    search?: string;
  }) => {
    const { page, pageSize, role, isActive, search } = filters;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          firstName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          phoneNumber: true,
          profileImage: true,
          createdAt: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate total spent for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const totalSpent = await prisma.order.aggregate({
          where: {
            userId: user.id,
            status: 'DELIVERED',
          },
          _sum: {
            totalAmount: true,
          },
        });

        return {
          ...user,
          orderCount: user._count.orders,
          totalSpent: totalSpent._sum.totalAmount || 0,
        };
      })
    );

    return {
      data: usersWithStats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / pageSize),
        pageSize,
        total,
      },
    };
  },

  getUserById: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      return null;
    }

    const totalSpent = await prisma.order.aggregate({
      where: {
        userId,
        status: 'DELIVERED',
      },
      _sum: {
        totalAmount: true,
      },
    });

    const avgOrderValue =
      user.orders.length > 0
        ? user.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0) /
          user.orders.length
        : 0;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      orderCount: user.orders.length,
      totalSpent: totalSpent._sum.totalAmount || 0,
      avgOrderValue,
      orders: user.orders,
    };
  },

  updateUserStatus: async (userId: string, isActive: boolean) => {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    return user;
  },

  getAnalytics: async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total revenue (sum of all delivered orders)
    const revenueData = await prisma.order.aggregate({
      where: {
        status: 'DELIVERED',
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Total orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    // Total users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
    });

    // Active users (isActive = true)
    const activeUsersCount = await prisma.user.count({
      where: { isActive: true },
    });

    // Recent orders (last 10)
    const recentOrders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Top selling products (by order count)
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _count: {
        id: true,
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, images: true, price: true },
        });
        return {
          ...product,
          orderCount: item._count.id,
          totalQuantitySold: item._sum.quantity || 0,
        };
      })
    );

    // Revenue trends (last 30 days)
    const revenueByDate = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
        status: 'DELIVERED',
      },
      _sum: {
        totalAmount: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      totalRevenue: Number(revenueData._sum.totalAmount || 0),
      totalOrders: await prisma.order.count(),
      totalUsers: await prisma.user.count(),
      activeUsers: activeUsersCount,
      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
      usersByRole: usersByRole.map((item) => ({
        role: item.role,
        count: item._count.id,
      })),
      recentOrders,
      topProducts: topProductsWithDetails,
      revenueByDate: revenueByDate.map((item) => ({
        date: item.createdAt,
        amount: Number(item._sum.totalAmount || 0),
      })),
    };
  },

  // Revenue Analytics Methods
  getRevenueTrends: async (
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ) => {
    const startTime = Date.now();
    const cacheKey = `analytics:revenue-trends:${startDate.toISOString()}:${endDate.toISOString()}:${groupBy}`;
    
    // Check cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.debug('Revenue trends cache hit');
      return JSON.parse(cached as string);
    }

    let trends;

    // Use materialized view for daily data when available
    if (groupBy === 'day') {
      try {
        trends = await prisma.$queryRaw<Array<{
          period: Date;
          revenue: number;
          orderCount: bigint;
          avgOrderValue: number;
        }>>`
          SELECT 
            date as period,
            CAST(total_revenue AS FLOAT) as revenue,
            order_count as "orderCount",
            CAST(avg_order_value AS FLOAT) as "avgOrderValue"
          FROM daily_revenue_summary
          WHERE date >= ${startDate}::date
            AND date <= ${endDate}::date
          ORDER BY date ASC
        `;
        logger.debug('Used daily_revenue_summary materialized view');
      } catch (error) {
        // Fallback to base table if materialized view doesn't exist
        logger.warn('Materialized view daily_revenue_summary not found, using base table');
        trends = await prisma.$queryRaw<Array<{
          period: Date;
          revenue: number;
          orderCount: bigint;
          avgOrderValue: number;
        }>>`
          SELECT 
            DATE("createdAt") as period,
            CAST(SUM("totalAmount") AS FLOAT) as revenue,
            COUNT(*) as "orderCount",
            CAST(AVG("totalAmount") AS FLOAT) as "avgOrderValue"
          FROM "Order"
          WHERE "status" = 'DELIVERED'
            AND "createdAt" >= ${startDate}
            AND "createdAt" <= ${endDate}
          GROUP BY DATE("createdAt")
          ORDER BY period ASC
        `;
      }
    } else {
      // Use date_trunc for week/month grouping
      let dateTrunc: string;
      switch (groupBy) {
        case 'week':
          dateTrunc = "date_trunc('week', \"createdAt\")";
          break;
        case 'month':
          dateTrunc = "date_trunc('month', \"createdAt\")";
          break;
        default:
          dateTrunc = "date_trunc('day', \"createdAt\")";
      }

      trends = await prisma.$queryRaw<Array<{
        period: Date;
        revenue: number;
        orderCount: bigint;
        avgOrderValue: number;
      }>>`
        SELECT 
          ${Prisma.raw(dateTrunc)} as period,
          CAST(SUM("totalAmount") AS FLOAT) as revenue,
          COUNT(*) as "orderCount",
          CAST(AVG("totalAmount") AS FLOAT) as "avgOrderValue"
        FROM "Order"
        WHERE "status" = 'DELIVERED'
          AND "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
        GROUP BY period
        ORDER BY period ASC
      `;
    }

    const result = trends.map(t => ({
      period: t.period,
      revenue: Number(t.revenue),
      orderCount: Number(t.orderCount),
      avgOrderValue: Number(t.avgOrderValue),
    }));

    // Cache with TTL based on data age
    const isHistorical = endDate < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const ttl = isHistorical ? 3600 : 300; // 1 hour for historical, 5 min for recent
    
    await cacheService.set(cacheKey, JSON.stringify(result), { ttl });

    const duration = Date.now() - startTime;
    logger.info('Revenue trends query executed', { duration, recordCount: result.length });

    return result;
  },

  getRevenueByCategory: async (startDate: Date, endDate: Date) => {
    const startTime = Date.now();
    const cacheKey = `analytics:revenue-by-category:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    const cached = await cacheService.get(cacheKey);
    if (cached) return JSON.parse(cached as string);

    const categoryRevenue = await prisma.$queryRaw<Array<{
      categoryId: string;
      categoryName: string;
      revenue: number;
      orderCount: bigint;
    }>>`
      SELECT 
        c.id as "categoryId",
        c.name as "categoryName",
        CAST(SUM(oi."totalPrice") AS FLOAT) as revenue,
        COUNT(DISTINCT o.id) as "orderCount"
      FROM "Order" o
      JOIN "OrderItem" oi ON o.id = oi."orderId"
      JOIN "Product" p ON oi."productId" = p.id
      JOIN "Category" c ON p."categoryId" = c.id
      WHERE o."status" = 'DELIVERED'
        AND o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `;

    const totalRevenue = categoryRevenue.reduce((sum, cat) => sum + Number(cat.revenue), 0);
    const result = categoryRevenue.map(cat => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      revenue: Number(cat.revenue),
      orderCount: Number(cat.orderCount),
      percentage: totalRevenue > 0 ? (Number(cat.revenue) / totalRevenue) * 100 : 0,
    }));

    await cacheService.set(cacheKey, JSON.stringify(result), { ttl: 900 });

    const duration = Date.now() - startTime;
    logger.info('Revenue by category query executed', { duration, recordCount: result.length });

    return result;
  },

  getRevenueByPaymentMethod: async (startDate: Date, endDate: Date) => {
    const cacheKey = `analytics:revenue-by-payment:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    const cached = await cacheService.get(cacheKey);
    if (cached) return JSON.parse(cached as string);

    const paymentRevenue = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        paymentStatus: 'COMPLETED',
        status: 'DELIVERED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { id: true },
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
    });

    const totalOrders = await prisma.order.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'DELIVERED',
      },
    });

    const result = paymentRevenue.map(pm => ({
      paymentMethod: pm.paymentMethod,
      revenue: Number(pm._sum.totalAmount || 0),
      orderCount: pm._count.id,
      avgTransactionValue: Number(pm._avg.totalAmount || 0),
      successRate: totalOrders > 0 ? (pm._count.id / totalOrders) * 100 : 0,
    }));

    await cacheService.set(cacheKey, JSON.stringify(result), { ttl: 900 });
    return result;
  },

  // Product Performance Methods
  getTopProductsByRevenue: async (
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ) => {
    const cacheKey = `analytics:top-products:${startDate.toISOString()}:${endDate.toISOString()}:${limit}`;
    
    const cached = await cacheService.get(cacheKey);
    if (cached) return JSON.parse(cached as string);

    const topProducts = await prisma.$queryRaw<Array<{
      productId: string;
      productName: string;
      image: string;
      currentPrice: string;
      revenue: number;
      unitsSold: number;
      orderCount: bigint;
    }>>`
      SELECT 
        p.id as "productId",
        p.name as "productName",
        p.images[1] as image,
        p.price as "currentPrice",
        CAST(SUM(oi."totalPrice") AS FLOAT) as revenue,
        CAST(SUM(oi.quantity) AS INT) as "unitsSold",
        COUNT(DISTINCT oi."orderId") as "orderCount"
      FROM "OrderItem" oi
      JOIN "Product" p ON oi."productId" = p.id
      JOIN "Order" o ON oi."orderId" = o.id
      WHERE o."status" = 'DELIVERED'
        AND o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
      GROUP BY p.id, p.name, p.images, p.price
      ORDER BY revenue DESC
      LIMIT ${limit}
    `;

    const result = topProducts.map(p => ({
      productId: p.productId,
      productName: p.productName,
      image: p.image,
      currentPrice: Number(p.currentPrice),
      revenue: Number(p.revenue),
      unitsSold: Number(p.unitsSold),
      orderCount: Number(p.orderCount),
    }));

    await cacheService.set(cacheKey, JSON.stringify(result), { ttl: 900 });
    return result;
  },

  getProductPerformanceMetrics: async (
    productId: string,
    startDate: Date,
    endDate: Date
  ) => {
    const startTime = Date.now();
    
    // Use date string for more stable cache keys
    const cacheKey = `product-metrics:${productId}:${startDate.toDateString()}:${endDate.toDateString()}`;
    
    const cached = await cacheService.get(cacheKey);
    if (cached) return JSON.parse(cached as string);

    const [salesData, reviews, cartCount, wishlistCount, product, viewCount, uniqueViewers] = await Promise.all([
      prisma.orderItem.aggregate({
        where: {
          productId,
          order: {
            status: 'DELIVERED',
            createdAt: { gte: startDate, lte: endDate },
          },
        },
        _sum: { quantity: true, totalPrice: true },
        _count: { orderId: true },
      }),
      prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { id: true },
      }),
      // Get cart additions within date range
      prisma.cartItem.count({
        where: {
          productId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Get wishlist additions within date range
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM "Wishlist"
        WHERE "productId" = ${productId}
          AND "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
      `.then(result => Number(result[0]?.count || 0))
        .catch(() => 0), // Fallback if Wishlist table is not available
      prisma.product.findUnique({
        where: { id: productId },
        select: { stockQuantity: true, lowStockThreshold: true },
      }),
      // Get real view count from ProductView tracking
      productViewService.getViewCount(productId, startDate, endDate),
      // Get unique viewers (by sessionId)
      productViewService.getUniqueViewers(productId, startDate, endDate),
    ]);

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const unitsSold = Number(salesData._sum.quantity || 0);
    const salesVelocity = days > 0 ? unitsSold / days : 0;

    const totalRevenue = await prisma.$queryRaw<Array<{ total: number }>>`
      SELECT CAST(SUM(oi."totalPrice") AS FLOAT) as total
      FROM "OrderItem" oi
      JOIN "Order" o ON oi."orderId" = o.id
      WHERE o."status" = 'DELIVERED'
        AND o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
    `;

    const revenueContribution = Number(totalRevenue[0]?.total || 0) > 0
      ? (Number(salesData._sum.totalPrice || 0) / Number(totalRevenue[0].total)) * 100
      : 0;

    // Use real views if available, fallback to estimate for historical data
    const estimatedViews = unitsSold * 10;
    const views = viewCount > 0 ? viewCount : estimatedViews;
    
    // Calculate conversion funnel metrics
    const conversionRate = views > 0 ? (unitsSold / views) * 100 : 0;
    const addToCartRate = views > 0 ? (cartCount / views) * 100 : 0;
    const cartToOrderRate = cartCount > 0 ? (unitsSold / cartCount) * 100 : 0;

    // Monitor anomalies: sales without views
    if (unitsSold > 0 && viewCount === 0 && views === estimatedViews) {
      logger.warn(`Product ${productId} has ${unitsSold} sales but 0 tracked views (using estimate)`);
    }

    const result = {
      productId,
      revenue: Number(salesData._sum.totalPrice || 0),
      unitsSold,
      orderCount: salesData._count.orderId,
      salesVelocity,
      revenueContribution,
      averageRating: Number(reviews._avg.rating || 0),
      reviewCount: reviews._count.id,
      cartAdditions: cartCount,
      wishlistCount,
      views,
      uniqueViewers,
      conversionRate,
      addToCartRate,
      cartToOrderRate,
      currentStock: product?.stockQuantity || 0,
      lowStockThreshold: product?.lowStockThreshold || 0,
      daysUntilStockout: salesVelocity > 0 && product
        ? Math.floor(product.stockQuantity / salesVelocity)
        : null,
      isViewDataReal: viewCount > 0,
    };

    const queryTime = Date.now() - startTime;
    logger.info(`Product performance metrics query completed in ${queryTime}ms`, { productId, views: viewCount, sales: unitsSold });
    
    if (queryTime > 500) {
      logger.warn(`Slow product performance metrics query: ${queryTime}ms for product ${productId}`);
    }

    // Cache for 10 minutes for recent data, longer for historical
    const isHistorical = endDate < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const ttl = isHistorical ? 3600 : 600;
    
    await cacheService.set(cacheKey, JSON.stringify(result), { ttl });
    return result;
  },

  getLowStockProducts: async (threshold?: number) => {
    const products = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      stockQuantity: number;
      lowStockThreshold: number;
      recentSales: number;
    }>>`
      SELECT 
        p.id,
        p.name,
        p."stockQuantity",
        p."lowStockThreshold",
        COALESCE(
          (SELECT CAST(SUM(oi.quantity) AS INT)
           FROM "OrderItem" oi
           JOIN "Order" o ON oi."orderId" = o.id
           WHERE oi."productId" = p.id
             AND o."status" = 'DELIVERED'
             AND o."createdAt" >= NOW() - INTERVAL '30 days'),
          0
        ) as "recentSales"
      FROM "Product" p
      WHERE p."stockQuantity" <= ${threshold !== undefined ? threshold : Prisma.sql`p."lowStockThreshold"`}
        AND p."isActive" = true
      ORDER BY p."stockQuantity" ASC
    `;

    return products.map(p => ({
      ...p,
      salesVelocity: Number(p.recentSales) / 30,
      daysUntilStockout: Number(p.recentSales) > 0
        ? Math.floor((p.stockQuantity * 30) / Number(p.recentSales))
        : null,
      urgency: p.stockQuantity === 0 ? 'critical' :
               p.stockQuantity <= p.lowStockThreshold * 0.5 ? 'high' :
               p.stockQuantity <= p.lowStockThreshold ? 'medium' : 'low',
    }));
  },

  // Customer Segmentation Methods
  getCustomerSegmentation: async (startDate: Date, endDate: Date) => {
    const cacheKey = `analytics:customer-segmentation:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    const cached = await cacheService.get(cacheKey);
    if (cached) return JSON.parse(cached as string);

    // Get all customers who made orders within the date range with their stats
    const customerStats = await prisma.$queryRaw<Array<{
      userId: string;
      orderCount: bigint;
      totalSpent: number;
      firstOrderDate: Date;
      lastOrderDate: Date;
    }>>`
      SELECT 
        "userId",
        COUNT(*) as "orderCount",
        CAST(SUM("totalAmount") AS FLOAT) as "totalSpent",
        MIN("createdAt") as "firstOrderDate",
        MAX("createdAt") as "lastOrderDate"
      FROM "Order"
      WHERE "status" = 'DELIVERED'
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY "userId"
    `;

    if (customerStats.length === 0) {
      return {
        newCustomers: { count: 0, percentage: 0 },
        returningCustomers: { count: 0, percentage: 0 },
        highValueCustomers: { count: 0, percentage: 0, threshold: 0 },
        atRiskCustomers: { count: 0, percentage: 0 },
        churnedCustomers: { count: 0, percentage: 0 },
        totalCustomersWithOrders: 0,
      };
    }

    // Calculate 80th percentile of spending within the date range
    const sortedSpending = customerStats
      .map(c => Number(c.totalSpent))
      .sort((a, b) => a - b);
    const p80Index = Math.floor(sortedSpending.length * 0.8);
    const highValueThreshold = sortedSpending[p80Index] || 0;

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneEightyDaysAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    let newCustomers = 0;
    let returningCustomers = 0;
    let highValueCustomers = 0;
    let atRiskCustomers = 0;
    let churnedCustomers = 0;

    customerStats.forEach(stat => {
      const orderCount = Number(stat.orderCount);
      const totalSpent = Number(stat.totalSpent);
      const lastOrderDate = new Date(stat.lastOrderDate);

      // High-value takes precedence
      if (totalSpent >= highValueThreshold) {
        highValueCustomers++;
      } else if (orderCount === 1) {
        newCustomers++;
      } else if (orderCount > 1) {
        returningCustomers++;
      }

      // Check for at-risk and churned (can overlap with other segments)
      if (lastOrderDate < oneEightyDaysAgo) {
        churnedCustomers++;
      } else if (lastOrderDate < ninetyDaysAgo) {
        atRiskCustomers++;
      }
    });

    const totalCustomersWithOrders = customerStats.length;

    const result = {
      newCustomers: {
        count: newCustomers,
        percentage: totalCustomersWithOrders > 0 ? (newCustomers / totalCustomersWithOrders) * 100 : 0,
      },
      returningCustomers: {
        count: returningCustomers,
        percentage: totalCustomersWithOrders > 0 ? (returningCustomers / totalCustomersWithOrders) * 100 : 0,
      },
      highValueCustomers: {
        count: highValueCustomers,
        percentage: totalCustomersWithOrders > 0 ? (highValueCustomers / totalCustomersWithOrders) * 100 : 0,
        threshold: highValueThreshold,
      },
      atRiskCustomers: {
        count: atRiskCustomers,
        percentage: totalCustomersWithOrders > 0 ? (atRiskCustomers / totalCustomersWithOrders) * 100 : 0,
      },
      churnedCustomers: {
        count: churnedCustomers,
        percentage: totalCustomersWithOrders > 0 ? (churnedCustomers / totalCustomersWithOrders) * 100 : 0,
      },
      totalCustomersWithOrders,
    };

    await cacheService.set(cacheKey, JSON.stringify(result), { ttl: 900 });
    return result;
  },

  getCustomerLifetimeValue: async () => {
    const cacheKey = 'analytics:customer-clv';
    
    const cached = await cacheService.get(cacheKey);
    if (cached) return JSON.parse(cached as string);

    const [avgCLV, cohortData, customerMetrics] = await Promise.all([
      prisma.$queryRaw<Array<{ avgClv: number; customerCount: bigint }>>`
        SELECT 
          CAST(AVG("lifetimeValue") AS FLOAT) as "avgClv",
          COUNT(*) as "customerCount"
        FROM (
          SELECT 
            "userId",
            SUM("totalAmount") as "lifetimeValue"
          FROM "Order"
          WHERE "status" = 'DELIVERED'
          GROUP BY "userId"
        ) as customer_values
      `,
      prisma.$queryRaw<Array<{
        cohort: Date;
        customerCount: bigint;
        avgClv: number;
      }>>`
        SELECT 
          date_trunc('month', u."createdAt") as cohort,
          COUNT(DISTINCT u.id) as "customerCount",
          CAST(AVG(COALESCE(order_totals."lifetimeValue", 0)) AS FLOAT) as "avgClv"
        FROM "User" u
        LEFT JOIN (
          SELECT 
            "userId",
            SUM("totalAmount") as "lifetimeValue"
          FROM "Order"
          WHERE "status" = 'DELIVERED'
          GROUP BY "userId"
        ) order_totals ON u.id = order_totals."userId"
        GROUP BY cohort
        ORDER BY cohort DESC
        LIMIT 12
      `,
      prisma.$queryRaw<Array<{
        avgOrderFrequency: number;
        avgOrderValue: number;
      }>>`
        SELECT 
          CAST(AVG("orderCount") AS FLOAT) as "avgOrderFrequency",
          CAST(AVG("avgOrderValue") AS FLOAT) as "avgOrderValue"
        FROM (
          SELECT 
            "userId",
            COUNT(*) as "orderCount",
            AVG("totalAmount") as "avgOrderValue"
          FROM "Order"
          WHERE "status" = 'DELIVERED'
          GROUP BY "userId"
        ) as customer_stats
      `,
    ]);

    const result = {
      averageLifetimeValue: Number(avgCLV[0]?.avgClv || 0),
      totalCustomersWithOrders: Number(avgCLV[0]?.customerCount || 0),
      cohorts: cohortData.map(c => ({
        cohort: c.cohort,
        customerCount: Number(c.customerCount),
        avgClv: Number(c.avgClv),
      })),
      avgOrderFrequency: Number(customerMetrics[0]?.avgOrderFrequency || 0),
      avgOrderValue: Number(customerMetrics[0]?.avgOrderValue || 0),
    };

    await cacheService.set(cacheKey, JSON.stringify(result), { ttl: 3600 });
    return result;
  },

  getTopCustomers: async (
    limit: number = 10,
    startDate: Date,
    endDate: Date
  ) => {
    const cacheKey = `analytics:top-customers:${limit}:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    const cached = await cacheService.get(cacheKey);
    if (cached) return JSON.parse(cached as string);

    const topCustomers = await prisma.$queryRaw<Array<{
      userId: string;
      email: string;
      firstName: string;
      lastName: string;
      totalSpent: number;
      orderCount: bigint;
      avgOrderValue: number;
    }>>`
      SELECT 
        u.id as "userId",
        u.email,
        u."firstName",
        u."lastName",
        CAST(SUM(o."totalAmount") AS FLOAT) as "totalSpent",
        COUNT(o.id) as "orderCount",
        CAST(AVG(o."totalAmount") AS FLOAT) as "avgOrderValue"
      FROM "User" u
      JOIN "Order" o ON u.id = o."userId"
      WHERE o."status" = 'DELIVERED'
        AND o."createdAt" >= ${startDate}
        AND o."createdAt" <= ${endDate}
      GROUP BY u.id, u.email, u."firstName", u."lastName"
      ORDER BY "totalSpent" DESC
      LIMIT ${limit}
    `;

    const result = topCustomers.map(c => ({
      userId: c.userId,
      email: c.email,
      name: `${c.firstName} ${c.lastName}`,
      totalSpent: Number(c.totalSpent),
      orderCount: Number(c.orderCount),
      avgOrderValue: Number(c.avgOrderValue),
    }));

    await cacheService.set(cacheKey, JSON.stringify(result), { ttl: 900 });
    return result;
  },

  // Order Statistics Methods
  getOrderStatistics: async (startDate: Date, endDate: Date) => {
    const cacheKey = `analytics:order-stats:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    const cached = await cacheService.get(cacheKey);
    if (cached) return JSON.parse(cached as string);

    const [orderMetrics, statusDistribution, hourlyDistribution] = await Promise.all([
      prisma.$queryRaw<Array<{
        avgOrderValue: number;
        totalOrders: bigint;
        deliveredOrders: bigint;
        avgProcessingTime: number;
        cancelledOrders: bigint;
      }>>`
        SELECT 
          CAST(AVG(CASE WHEN "status" = 'DELIVERED' THEN "totalAmount" END) AS FLOAT) as "avgOrderValue",
          COUNT(*) as "totalOrders",
          COUNT(CASE WHEN "status" = 'DELIVERED' THEN 1 END) as "deliveredOrders",
          CAST(AVG(
            CASE 
              WHEN "status" = 'DELIVERED' AND "deliveredAt" IS NOT NULL 
              THEN EXTRACT(EPOCH FROM ("deliveredAt" - "createdAt")) / 3600
            END
          ) AS FLOAT) as "avgProcessingTime",
          COUNT(CASE WHEN "status" = 'CANCELLED' THEN 1 END) as "cancelledOrders"
        FROM "Order"
        WHERE "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
      `,
      prisma.order.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
      }),
      prisma.$queryRaw<Array<{ hour: number; orderCount: bigint }>>`
        SELECT 
          EXTRACT(HOUR FROM "createdAt") as hour,
          COUNT(*) as "orderCount"
        FROM "Order"
        WHERE "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
        GROUP BY hour
        ORDER BY hour
      `,
    ]);

    const metrics = orderMetrics[0];
    const totalOrders = Number(metrics?.totalOrders || 0);
    const deliveredOrders = Number(metrics?.deliveredOrders || 0);
    const cancelledOrders = Number(metrics?.cancelledOrders || 0);

    const result = {
      avgOrderValue: Number(metrics?.avgOrderValue || 0),
      totalOrders,
      orderCompletionRate: totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0,
      avgProcessingTimeHours: Number(metrics?.avgProcessingTime || 0),
      cancellationRate: totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0,
      ordersByStatus: statusDistribution.map(s => ({
        status: s.status,
        count: s._count.id,
        percentage: totalOrders > 0 ? (s._count.id / totalOrders) * 100 : 0,
      })),
      peakOrderingHours: hourlyDistribution.map(h => ({
        hour: Number(h.hour),
        orderCount: Number(h.orderCount),
      })),
    };

    await cacheService.set(cacheKey, JSON.stringify(result), { ttl: 900 });
    return result;
  },

  getConversionMetrics: async (startDate: Date, endDate: Date) => {
    const cacheKey = `analytics:conversion-metrics:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    const cached = await cacheService.get(cacheKey);
    if (cached) return JSON.parse(cached as string);

    const [cartMetrics, orderMetrics] = await Promise.all([
      prisma.$queryRaw<Array<{
        uniqueCartsWithItems: bigint;
      }>>`
        SELECT COUNT(DISTINCT c.id) as "uniqueCartsWithItems"
        FROM "Cart" c
        JOIN "CartItem" ci ON c.id = ci."cartId"
        WHERE c."createdAt" >= ${startDate}
          AND c."createdAt" <= ${endDate}
      `,
      prisma.order.groupBy({
        by: ['paymentStatus'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
      }),
    ]);

    const uniqueCarts = Number(cartMetrics[0]?.uniqueCartsWithItems || 0);
    const ordersCreated = await prisma.order.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });
    const completedPayments = orderMetrics.find(om => om.paymentStatus === 'COMPLETED')?._count.id || 0;

    const result = {
      cartCreationCount: uniqueCarts,
      checkoutInitiationCount: ordersCreated,
      paymentCompletionCount: completedPayments,
      cartToOrderConversionRate: uniqueCarts > 0 ? (ordersCreated / uniqueCarts) * 100 : 0,
      orderToPaymentConversionRate: ordersCreated > 0 ? (completedPayments / ordersCreated) * 100 : 0,
      overallConversionRate: uniqueCarts > 0 ? (completedPayments / uniqueCarts) * 100 : 0,
      cartAbandonmentRate: uniqueCarts > 0 ? ((uniqueCarts - ordersCreated) / uniqueCarts) * 100 : 0,
    };

    await cacheService.set(cacheKey, JSON.stringify(result), { ttl: 900 });
    return result;
  },

  getAverageOrderValueTrends: async (
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ) => {
    const cacheKey = `analytics:aov-trends:${startDate.toISOString()}:${endDate.toISOString()}:${groupBy}`;
    
    const cached = await cacheService.get(cacheKey);
    if (cached) return JSON.parse(cached as string);

    let dateTrunc: string;
    switch (groupBy) {
      case 'week':
        dateTrunc = "date_trunc('week', \"createdAt\")";
        break;
      case 'month':
        dateTrunc = "date_trunc('month', \"createdAt\")";
        break;
      default:
        dateTrunc = "date_trunc('day', \"createdAt\")";
    }

    const trends = await prisma.$queryRaw<Array<{
      period: Date;
      avgOrderValue: number;
      orderCount: bigint;
    }>>`
      SELECT 
        ${Prisma.raw(dateTrunc)} as period,
        CAST(AVG("totalAmount") AS FLOAT) as "avgOrderValue",
        COUNT(*) as "orderCount"
      FROM "Order"
      WHERE "status" = 'DELIVERED'
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY period
      ORDER BY period ASC
    `;

    const result = trends.map((t, index, arr) => {
      const trend = index > 0 
        ? Number(t.avgOrderValue) > Number(arr[index - 1].avgOrderValue) ? 'increasing' : 'decreasing'
        : 'stable';
      
      return {
        period: t.period,
        avgOrderValue: Number(t.avgOrderValue),
        orderCount: Number(t.orderCount),
        trend,
      };
    });

    await cacheService.set(cacheKey, JSON.stringify(result), { ttl: 900 });
    return result;
  },
};

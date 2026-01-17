import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { cacheService } from '../services/cache.service';
import { cacheMetricsService } from '../services/cache-metrics.service';

const prisma = new PrismaClient();

export const adminController = {
  // Get all orders with pagination and filters
  getAllOrders: async (req: Request, res: Response) => {
    try {
      const { page = 1, pageSize = 10, status, startDate, endDate, search } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const pageSizeNum = parseInt(pageSize as string) || 10;
      const skip = (pageNum - 1) * pageSizeNum;

      const where: any = {};

      if (status && status !== 'All') {
        where.status = status;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate as string);
        }
      }

      if (search) {
        where.orderNumber = {
          contains: search as string,
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
          take: pageSizeNum,
        }),
        prisma.order.count({ where }),
      ]);

      res.json({
        data: orders,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total,
          totalPages: Math.ceil(total / pageSizeNum),
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  },

  // Get all users with pagination and filters
  getAllUsers: async (req: Request, res: Response) => {
    try {
      const { page = 1, pageSize = 10, role, isActive, search } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const pageSizeNum = parseInt(pageSize as string) || 10;
      const skip = (pageNum - 1) * pageSizeNum;

      const where: any = {};

      if (role && role !== 'All') {
        where.role = role;
      }

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      if (search) {
        where.OR = [
          { email: { contains: search as string, mode: 'insensitive' } },
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
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
            createdAt: true,
            _count: {
              select: { orders: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSizeNum,
        }),
        prisma.user.count({ where }),
      ]);

      // Calculate total spent for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const totalSpent = await prisma.order.aggregate({
            where: {
              userId: user.id,
              status: { in: ['DELIVERED', 'CONFIRMED'] },
            },
            _sum: { totalAmount: true },
          });

          return {
            ...user,
            orderCount: user._count.orders,
            totalSpent: parseFloat(totalSpent._sum.totalAmount || '0'),
          };
        })
      );

      res.json({
        data: usersWithStats,
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          total,
          totalPages: Math.ceil(total / pageSizeNum),
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },

  // Get user by ID with details
  getUserById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          phone: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const orders = await prisma.order.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      const totalSpent = await prisma.order.aggregate({
        where: { userId: id },
        _sum: { totalAmount: true },
        _count: true,
      });

      const avgOrderValue =
        totalSpent._count > 0 ? parseFloat(totalSpent._sum.totalAmount || '0') / totalSpent._count : 0;

      res.json({
        user,
        statistics: {
          totalOrders: totalSpent._count,
          totalSpent: parseFloat(totalSpent._sum.totalAmount || '0'),
          averageOrderValue: avgOrderValue,
        },
        recentOrders: orders,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  },

  // Update user active status
  updateUserStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: { isActive },
      });

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user status' });
    }
  },

  // Get dashboard analytics
  getAnalytics: async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Total revenue (from delivered orders)
      const revenueData = await prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
        },
        _sum: { totalAmount: true },
      });

      // Total orders by status
      const ordersByStatus = await prisma.order.groupBy({
        by: ['status'],
        _count: true,
      });

      // Total users by role
      const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        _count: true,
      });

      // Recent orders (last 10)
      const recentOrders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      });

      // Top selling products
      const topProducts = await prisma.orderItem.groupBy({
        by: ['productId', 'productName'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      });

      // Revenue trend (daily for last 30 days)
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          status: 'DELIVERED',
        },
        select: {
          createdAt: true,
          totalAmount: true,
        },
      });

      const revenueByDate: Record<string, number> = {};
      orders.forEach((order) => {
        const date = order.createdAt.toISOString().split('T')[0];
        revenueByDate[date] = (revenueByDate[date] || 0) + parseFloat(order.totalAmount);
      });

      // Total users
      const totalUsers = await prisma.user.count();

      // Active users (with at least one order)
      const activeUsers = await prisma.user.count({
        where: {
          orders: {
            some: {},
          },
        },
      });

      res.json({
        totalRevenue: parseFloat(revenueData._sum.totalAmount || '0'),
        totalOrders: ordersByStatus.reduce((acc, item) => acc + item._count, 0),
        totalUsers,
        activeUsers,
        ordersByStatus: ordersByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
        usersByRole: usersByRole.map((item) => ({
          role: item.role,
          count: item._count,
        })),
        recentOrders: recentOrders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: `${order.user.firstName} ${order.user.lastName}`,
          totalAmount: order.totalAmount,
          status: order.status,
          createdAt: order.createdAt,
        })),
        topProducts: topProducts.map((item) => ({
          name: item.productName,
          orderCount: item._count.id,
        })),
        revenueByDate,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  },

  // Get cache metrics
  getCacheMetrics: async (req: Request, res: Response) => {
    try {
      const metrics = cacheMetricsService.getMetrics();
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch cache metrics' });
    }
  },

  // Clear all cache
  clearCache: async (req: Request, res: Response) => {
    try {
      await cacheService.flush();
      cacheMetricsService.resetMetrics();
      res.json({
        success: true,
        message: 'Cache cleared successfully',
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  },

  // Clear cache by pattern
  clearCacheByPattern: async (req: Request, res: Response) => {
    try {
      const { pattern } = req.params;
      
      if (!pattern) {
        return res.status(400).json({ error: 'Pattern is required' });
      }

      await cacheService.delPattern(pattern);
      
      res.json({
        success: true,
        message: `Cache cleared for pattern: ${pattern}`,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear cache by pattern' });
    }
  },
};

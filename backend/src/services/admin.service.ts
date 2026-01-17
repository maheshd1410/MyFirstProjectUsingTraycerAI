import { PrismaClient } from '@prisma/client';

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
          phone: true,
          avatar: true,
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
        ? user.orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0) /
          user.orders.length
        : 0;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      avatar: user.avatar,
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
          select: { id: true, name: true, image: true, price: true },
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
      totalRevenue: parseFloat(revenueData._sum.totalAmount || 0),
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
        amount: parseFloat(item._sum.totalAmount || 0),
      })),
    };
  },
};

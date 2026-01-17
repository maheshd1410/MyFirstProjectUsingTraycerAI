import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/authorizationMiddleware';
import { adminController } from '../controllers/admin.controller';
import { csrfProtection } from '../middleware/csrf';
import { adminValidator } from '../middleware/validators/admin.validator';

const router = Router();

// All admin routes are protected with authentication and ADMIN role
router.use(authenticate, requireRole('ADMIN'));

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *         description: Filter by order status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of all orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/orders', adminController.getAllOrders);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users', adminController.getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users/:id', adminController.getUserById);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   put:
 *     summary: Update user status (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/users/:id/status', csrfProtection, adminController.updateUserStatus);

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get analytics data (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRevenue:
 *                   type: number
 *                 totalOrders:
 *                   type: integer
 *                 totalUsers:
 *                   type: integer
 *                 totalProducts:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/analytics', adminController.getAnalytics);

/**
 * @swagger
 * /api/admin/cache/metrics:
 *   get:
 *     summary: Get cache performance metrics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cache metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hits:
 *                   type: integer
 *                 misses:
 *                   type: integer
 *                 hitRate:
 *                   type: number
 *                 avgHitResponseTime:
 *                   type: number
 *                 avgMissResponseTime:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/cache/metrics', adminController.getCacheMetrics);

/**
 * @swagger
 * /api/admin/cache/clear:
 *   post:
 *     summary: Clear all cache (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/cache/clear', csrfProtection, adminController.clearCache);

/**
 * @swagger
 * /api/admin/cache/{pattern}:
 *   delete:
 *     summary: Clear cache by pattern (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pattern
 *         required: true
 *         schema:
 *           type: string
 *         description: Cache key pattern (e.g., 'product:*', 'categories:*')
 *     responses:
 *       200:
 *         description: Cache cleared for pattern
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 pattern:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/cache/:pattern', csrfProtection, adminController.clearCacheByPattern);

// Analytics & Reporting Routes

/**
 * @swagger
 * /api/admin/reports/revenue-trends:
 *   get:
 *     summary: Get revenue trends over time
 *     tags: [Admin Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (defaults to 30 days ago)
 *         example: "2024-01-01"
 *       - name: endDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (defaults to today)
 *         example: "2024-01-31"
 *       - name: groupBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: Time grouping
 *     responses:
 *       200:
 *         description: Revenue trends data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     trends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                             format: date-time
 *                           revenue:
 *                             type: number
 *                           orderCount:
 *                             type: integer
 *                           avgOrderValue:
 *                             type: number
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get(
  '/reports/revenue-trends',
  adminValidator.validateDateRange,
  adminValidator.validateGroupBy,
  adminController.getRevenueTrendsReport
);

/**
 * @swagger
 * /api/admin/reports/sales-summary:
 *   get:
 *     summary: Get comprehensive sales summary report
 *     tags: [Admin Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *       - name: endDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Sales summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalRevenue:
 *                           type: number
 *                         totalOrders:
 *                           type: integer
 *                         avgOrderValue:
 *                           type: number
 *                     revenueByCategory:
 *                       type: array
 *                     topProducts:
 *                       type: array
 *                     orderStats:
 *                       type: object
 */
router.get(
  '/reports/sales-summary',
  adminValidator.validateDateRange,
  adminController.getSalesSummaryReport
);

/**
 * @swagger
 * /api/admin/reports/customer-insights:
 *   get:
 *     summary: Get customer analytics and segmentation
 *     tags: [Admin Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of top customers to return
 *     responses:
 *       200:
 *         description: Customer insights data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     segmentation:
 *                       type: object
 *                     lifetimeValue:
 *                       type: object
 *                     topCustomers:
 *                       type: array
 */
router.get(
  '/reports/customer-insights',
  adminValidator.validateDateRange,
  adminValidator.validatePagination,
  adminController.getCustomerInsightsReport
);

/**
 * @swagger
 * /api/admin/reports/product-performance:
 *   get:
 *     summary: Get product performance analytics
 *     tags: [Admin Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: threshold
 *         in: query
 *         schema:
 *           type: integer
 *         description: Stock threshold for low stock alerts
 *     responses:
 *       200:
 *         description: Product performance data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     topProducts:
 *                       type: array
 *                     lowStockProducts:
 *                       type: array
 *                     categoryPerformance:
 *                       type: array
 */
router.get(
  '/reports/product-performance',
  adminValidator.validateDateRange,
  adminValidator.validatePagination,
  adminValidator.validateThreshold,
  adminController.getProductPerformanceReport
);

/**
 * @swagger
 * /api/admin/reports/conversion-funnel:
 *   get:
 *     summary: Get conversion funnel metrics
 *     tags: [Admin Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Conversion funnel data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversion:
 *                       type: object
 *                       properties:
 *                         cartToOrderConversionRate:
 *                           type: number
 *                         orderToPaymentConversionRate:
 *                           type: number
 *                         overallConversionRate:
 *                           type: number
 *                     orders:
 *                       type: object
 */
router.get(
  '/reports/conversion-funnel',
  adminValidator.validateDateRange,
  adminController.getConversionFunnelReport
);

/**
 * @swagger
 * /api/admin/analytics/product/{productId}:
 *   get:
 *     summary: Get detailed analytics for a specific product
 *     tags: [Admin Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - name: startDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Product analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                     metrics:
 *                       type: object
 *                       properties:
 *                         revenue:
 *                           type: number
 *                           description: Total revenue from this product
 *                         unitsSold:
 *                           type: integer
 *                           description: Total units sold
 *                         salesVelocity:
 *                           type: number
 *                           description: Units sold per day
 *                         averageRating:
 *                           type: number
 *                           description: Average customer rating
 *                         views:
 *                           type: integer
 *                           description: Total product views (real tracking data or estimate)
 *                         uniqueViewers:
 *                           type: integer
 *                           description: Unique viewers by session
 *                         conversionRate:
 *                           type: number
 *                           description: Views to purchase conversion rate (%)
 *                         addToCartRate:
 *                           type: number
 *                           description: Views to cart addition rate (%)
 *                         cartToOrderRate:
 *                           type: number
 *                           description: Cart additions to purchase rate (%)
 *                         cartAdditions:
 *                           type: integer
 *                           description: Times added to cart
 *                         wishlistCount:
 *                           type: integer
 *                           description: Times added to wishlist
 *                         isViewDataReal:
 *                           type: boolean
 *                           description: Whether view data is from tracking (true) or estimated (false)
 *       404:
 *         description: Product not found
 */
router.get(
  '/analytics/product/:productId',
  adminValidator.validateDateRange,
  adminValidator.validateProductId,
  adminController.getProductAnalytics
);

/**
 * @swagger
 * /api/admin/analytics/refresh-views:
 *   post:
 *     summary: Refresh materialized views for analytics
 *     tags: [Admin Analytics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Views refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Analytics views refreshed successfully"
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     duration:
 *                       type: string
 *                       example: "2345ms"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       500:
 *         description: Server error
 */
router.post(
  '/analytics/refresh-views',
  csrfProtection,
  adminController.refreshAnalyticsViews
);

export default router;

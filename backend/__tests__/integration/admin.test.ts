import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import {
  clearDatabase,
  createTestUser,
  createTestOrder,
  createTestAddress,
  createTestProduct,
  createTestCategory,
} from '../helpers/database.helper';
import { generateTestTokens } from '../helpers/auth.helper';

const prisma = new PrismaClient();

describe('Admin Integration Tests', () => {
  let adminUser: any;
  let adminToken: string;
  let customerUser: any;
  let customerToken: string;

  beforeAll(async () => {
    await clearDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create admin user
    adminUser = await createTestUser({ role: 'ADMIN' });
    const adminTokens = generateTestTokens(adminUser.id, 'ADMIN');
    adminToken = adminTokens.accessToken;

    // Create customer user
    customerUser = await createTestUser({ role: 'CUSTOMER' });
    const customerTokens = generateTestTokens(customerUser.id, 'CUSTOMER');
    customerToken = customerTokens.accessToken;
  });

  afterAll(async () => {
    await clearDatabase();
    await prisma.$disconnect();
  });

  describe('GET /api/admin/orders', () => {
    it('should successfully retrieve all orders with admin token', async () => {
      // Create test data
      const address = await createTestAddress(customerUser.id);
      const category = await createTestCategory();
      const product = await createTestProduct({ categoryId: category.id });
      await createTestOrder(customerUser.id, address.id);

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('orders');
      expect(Array.isArray(response.body.orders)).toBe(true);
      expect(response.body.orders.length).toBeGreaterThan(0);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/admin/orders')
        .expect(401);
    });

    it('should return 403 with customer role token', async () => {
      await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/orders?page=1&pageSize=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pageSize');
    });

    it('should support filtering by status', async () => {
      const response = await request(app)
        .get('/api/admin/orders?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('orders');
    });

    it('should return orders from all users', async () => {
      // Create orders for multiple users
      const user2 = await createTestUser();
      const address1 = await createTestAddress(customerUser.id);
      const address2 = await createTestAddress(user2.id);
      
      await createTestOrder(customerUser.id, address1.id);
      await createTestOrder(user2.id, address2.id);

      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.orders.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should successfully retrieve all users with admin token', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/admin/users')
        .expect(401);
    });

    it('should return 403 with customer role token', async () => {
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should exclude password field from response', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const user = response.body.users[0];
      expect(user).not.toHaveProperty('password');
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&pageSize=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pageSize');
    });

    it('should support filtering by role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=CUSTOMER')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
    });

    it('should support filtering by active status', async () => {
      const response = await request(app)
        .get('/api/admin/users?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
    });

    it('should support search by email or name', async () => {
      const response = await request(app)
        .get(`/api/admin/users?search=${customerUser.email}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should successfully retrieve user details with admin token', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', customerUser.id);
      expect(response.body).toHaveProperty('email', customerUser.email);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get(`/api/admin/users/${customerUser.id}`)
        .expect(401);
    });

    it('should return 403 with customer role token', async () => {
      await request(app)
        .get(`/api/admin/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/admin/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should exclude password field from response', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).not.toHaveProperty('password');
    });
  });

  describe('PUT /api/admin/users/:id/status', () => {
    it('should successfully toggle user active status', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${customerUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(response.body).toHaveProperty('isActive', false);

      // Verify in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: customerUser.id },
      });
      expect(updatedUser?.isActive).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .put(`/api/admin/users/${customerUser.id}/status`)
        .send({ isActive: false })
        .expect(401);
    });

    it('should return 403 with customer role token', async () => {
      await request(app)
        .put(`/api/admin/users/${customerUser.id}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ isActive: false })
        .expect(403);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .put('/api/admin/users/non-existent-id/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(404);
    });

    it('should activate inactive user', async () => {
      // First deactivate
      await prisma.user.update({
        where: { id: customerUser.id },
        data: { isActive: false },
      });

      // Then activate
      const response = await request(app)
        .put(`/api/admin/users/${customerUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true })
        .expect(200);

      expect(response.body).toHaveProperty('isActive', true);
    });

    it('should deactivate active user', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${customerUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(response.body).toHaveProperty('isActive', false);
    });
  });

  describe('GET /api/admin/analytics', () => {
    it('should successfully retrieve analytics data with admin token', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body).toHaveProperty('totalOrders');
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalProducts');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/admin/analytics')
        .expect(401);
    });

    it('should return 403 with customer role token', async () => {
      await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should include orders by status breakdown', async () => {
      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('ordersByStatus');
    });

    it('should return zero values for empty database', async () => {
      await clearDatabase();
      
      // Recreate admin user
      adminUser = await createTestUser({ role: 'ADMIN' });
      const tokens = generateTestTokens(adminUser.id, 'ADMIN');
      adminToken = tokens.accessToken;

      const response = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.totalOrders).toBe(0);
      expect(response.body.totalUsers).toBeGreaterThanOrEqual(1); // At least admin
    });

    it('should support date range filtering', async () => {
      const startDate = new Date('2026-01-01').toISOString();
      const endDate = new Date('2026-12-31').toISOString();

      const response = await request(app)
        .get(`/api/admin/analytics?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalRevenue');
    });
  });
});

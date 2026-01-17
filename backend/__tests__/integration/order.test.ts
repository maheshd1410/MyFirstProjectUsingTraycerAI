import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import {
  clearDatabase,
  createTestUser,
  createTestProduct,
  createTestCategory,
  createTestAddress,
  createTestOrder,
} from '../helpers/database.helper';
import { generateTestTokens } from '../helpers/auth.helper';

const prisma = new PrismaClient();

describe('Order Integration Tests', () => {
  let user: any;
  let token: string;
  let adminUser: any;
  let adminToken: string;
  let product: any;
  let address: any;

  beforeAll(async () => {
    await clearDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    user = await createTestUser({ role: 'CUSTOMER' });
    const tokens = generateTestTokens(user.id, 'CUSTOMER');
    token = tokens.accessToken;
    adminUser = await createTestUser({ role: 'ADMIN' });
    const adminTokens = generateTestTokens(adminUser.id, 'ADMIN');
    adminToken = adminTokens.accessToken;
    const category = await createTestCategory();
    product = await createTestProduct({ categoryId: category.id, stockQuantity: 100 });
    address = await createTestAddress(user.id);
  });

  afterAll(async () => {
    await clearDatabase();
    await prisma.$disconnect();
  });

  describe('POST /api/orders', () => {
    it('should create order from cart', async () => {
      // Add item to cart
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product.id, quantity: 2 });

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ addressId: address.id, paymentMethod: 'COD' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('orderNumber');
      expect(response.body).toHaveProperty('status', 'PENDING');
    });

    it('should return 401 without auth', async () => {
      await request(app).post('/api/orders').send({}).expect(401);
    });

    it('should return 400 for missing fields', async () => {
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });

    it('should return 400 for invalid payment method', async () => {
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ addressId: address.id, paymentMethod: 'INVALID' })
        .expect(400);
    });
  });

  describe('GET /api/orders', () => {
    it('should retrieve user orders', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(response.body).toHaveProperty('orders');
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/orders').expect(401);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/orders?page=1&pageSize=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/orders?status=PENDING')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(response.body).toHaveProperty('orders');
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should retrieve order by ID', async () => {
      const order = await createTestOrder(user.id, address.id);
      const response = await request(app)
        .get(`/api/orders/${order.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(response.body).toHaveProperty('id', order.id);
    });

    it('should return 401 without auth', async () => {
      const order = await createTestOrder(user.id, address.id);
      await request(app).get(`/api/orders/${order.id}`).expect(401);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app)
        .get('/api/orders/non-existent')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    it('should update order status with admin token', async () => {
      const order = await createTestOrder(user.id, address.id);
      const response = await request(app)
        .put(`/api/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);
      expect(response.body).toHaveProperty('status', 'CONFIRMED');
    });

    it('should return 401 without auth', async () => {
      const order = await createTestOrder(user.id, address.id);
      await request(app).put(`/api/orders/${order.id}/status`).send({}).expect(401);
    });

    it('should return 403 with customer token', async () => {
      const order = await createTestOrder(user.id, address.id);
      await request(app)
        .put(`/api/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'CONFIRMED' })
        .expect(403);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app)
        .put('/api/orders/non-existent/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(404);
    });
  });

  describe('DELETE /api/orders/:id (Cancel Order)', () => {
    it('should cancel order with valid cancellationReason', async () => {
      const order = await createTestOrder(user.id, address.id);
      const response = await request(app)
        .delete(`/api/orders/${order.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ cancellationReason: 'Changed my mind about this purchase' })
        .expect(200);
      expect(response.body).toHaveProperty('status', 'CANCELLED');
      expect(response.body).toHaveProperty('cancellationReason');
    });

    it('should return 401 without auth', async () => {
      const order = await createTestOrder(user.id, address.id);
      await request(app).delete(`/api/orders/${order.id}`).send({}).expect(401);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app)
        .delete('/api/orders/non-existent')
        .set('Authorization', `Bearer ${token}`)
        .send({ cancellationReason: 'Valid reason here' })
        .expect(404);
    });

    it('should return 400 when cancellationReason is missing', async () => {
      const order = await createTestOrder(user.id, address.id);
      await request(app)
        .delete(`/api/orders/${order.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });

    it('should return 400 when cancellationReason is too short', async () => {
      const order = await createTestOrder(user.id, address.id);
      await request(app)
        .delete(`/api/orders/${order.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ cancellationReason: 'short' })
        .expect(400);
    });

    it('should return 400 for already cancelled order', async () => {
      const order = await createTestOrder(user.id, address.id, { status: 'CANCELLED' });
      await request(app)
        .delete(`/api/orders/${order.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ cancellationReason: 'Trying to cancel again' })
        .expect(400);
    });

    it('should return 400 for already delivered order', async () => {
      const order = await createTestOrder(user.id, address.id, { status: 'DELIVERED' });
      await request(app)
        .delete(`/api/orders/${order.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ cancellationReason: 'Cannot cancel delivered order' })
        .expect(400);
    });
  });
});

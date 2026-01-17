import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import {
  clearDatabase,
  createTestUser,
  createTestProduct,
  createTestCategory,
  createTestCart,
} from '../helpers/database.helper';
import { generateTestTokens } from '../helpers/auth.helper';

const prisma = new PrismaClient();

describe('Cart & Wishlist Integration Tests', () => {
  let user: any;
  let token: string;
  let product: any;
  let category: any;

  beforeAll(async () => {
    await clearDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    user = await createTestUser({ role: 'CUSTOMER' });
    const tokens = generateTestTokens(user.id, 'CUSTOMER');
    token = tokens.accessToken;
    category = await createTestCategory();
    product = await createTestProduct({ categoryId: category.id, stockQuantity: 100 });
  });

  afterAll(async () => {
    await clearDatabase();
    await prisma.$disconnect();
  });

  // CART TESTS
  describe('GET /api/cart', () => {
    it('should retrieve user cart', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('totalAmount');
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/cart').expect(401);
    });
  });

  describe('POST /api/cart/items', () => {
    it('should add product to cart', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product.id, quantity: 2 })
        .expect(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    it('should return 401 without auth', async () => {
      await request(app).post('/api/cart/items').send({}).expect(401);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: 'non-existent', quantity: 1 })
        .expect(404);
    });

    it('should return 400 for invalid quantity', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product.id, quantity: -1 })
        .expect(400);
    });

    it('should return 400 for zero quantity', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product.id, quantity: 0 })
        .expect(400);
    });
  });

  describe('PUT /api/cart/items/:id', () => {
    it('should update cart item quantity', async () => {
      // Add item first
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product.id, quantity: 2 });

      const cart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: { items: true },
      });
      const itemId = cart!.items[0].id;

      const response = await request(app)
        .put(`/api/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 3 })
        .expect(200);
      expect(response.body.items[0].quantity).toBe(3);
    });

    it('should return 401 without auth', async () => {
      await request(app).put('/api/cart/items/any-id').send({}).expect(401);
    });

    it('should return 404 for non-existent item', async () => {
      await request(app)
        .put('/api/cart/items/non-existent')
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 1 })
        .expect(404);
    });

    it('should return 400 for invalid quantity', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product.id, quantity: 2 });

      const cart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: { items: true },
      });
      const itemId = cart!.items[0].id;

      await request(app)
        .put(`/api/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: -1 })
        .expect(400);
    });
  });

  describe('DELETE /api/cart/items/:id', () => {
    it('should remove item from cart', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product.id, quantity: 2 });

      const cart = await prisma.cart.findUnique({
        where: { userId: user.id },
        include: { items: true },
      });
      const itemId = cart!.items[0].id;

      await request(app)
        .delete(`/api/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should return 401 without auth', async () => {
      await request(app).delete('/api/cart/items/any-id').expect(401);
    });

    it('should return 404 for non-existent item', async () => {
      await request(app)
        .delete('/api/cart/items/non-existent')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('DELETE /api/cart', () => {
    it('should clear entire cart', async () => {
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product.id, quantity: 2 });

      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 without auth', async () => {
      await request(app).delete('/api/cart').expect(401);
    });
  });

  // WISHLIST TESTS
  describe('GET /api/wishlist', () => {
    it('should retrieve user wishlist', async () => {
      const response = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('totalItems');
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/wishlist').expect(401);
    });
  });

  describe('POST /api/wishlist/items', () => {
    it('should add product to wishlist', async () => {
      const response = await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product.id })
        .expect(200);
      expect(response.body).toHaveProperty('items');
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    it('should return 401 without auth', async () => {
      await request(app).post('/api/wishlist/items').send({}).expect(401);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: 'non-existent' })
        .expect(404);
    });
  });

  describe('GET /api/wishlist/check/:productId', () => {
    it('should check if product in wishlist', async () => {
      await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product.id });

      const response = await request(app)
        .get(`/api/wishlist/check/${product.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(response.body).toHaveProperty('isInWishlist');
    });

    it('should return 401 without auth', async () => {
      await request(app).get(`/api/wishlist/check/${product.id}`).expect(401);
    });
  });

  describe('DELETE /api/wishlist/items/:productId', () => {
    it('should remove product from wishlist', async () => {
      await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product.id });

      await request(app)
        .delete(`/api/wishlist/items/${product.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should return 401 without auth', async () => {
      await request(app).delete(`/api/wishlist/items/${product.id}`).expect(401);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app)
        .delete('/api/wishlist/items/non-existent')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('DELETE /api/wishlist', () => {
    it('should clear entire wishlist', async () => {
      await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: product.id });

      const response = await request(app)
        .delete('/api/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(response.body).toHaveProperty('items');
    });

    it('should return 401 without auth', async () => {
      await request(app).delete('/api/wishlist').expect(401);
    });
  });
});

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import {
  clearDatabase,
  createTestUser,
  createTestProduct,
  createTestCategory,
} from '../helpers/database.helper';
import { generateTestTokens } from '../helpers/auth.helper';

const prisma = new PrismaClient();

describe('Product Integration Tests', () => {
  let adminUser: any;
  let adminToken: string;
  let customerUser: any;
  let customerToken: string;
  let testCategory: any;

  beforeAll(async () => {
    await clearDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    adminUser = await createTestUser({ role: 'ADMIN' });
    const adminTokens = generateTestTokens(adminUser.id, 'ADMIN');
    adminToken = adminTokens.accessToken;
    customerUser = await createTestUser({ role: 'CUSTOMER' });
    const customerTokens = generateTestTokens(customerUser.id, 'CUSTOMER');
    customerToken = customerTokens.accessToken;
    testCategory = await createTestCategory();
  });

  afterAll(async () => {
    await clearDatabase();
    await prisma.$disconnect();
  });

  describe('GET /api/products', () => {
    it('should retrieve all products with pagination', async () => {
      await createTestProduct({ categoryId: testCategory.id });
      await createTestProduct({ categoryId: testCategory.id });

      const response = await request(app)
        .get('/api/products?page=1&pageSize=10')
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('pageSize', 10);
    });

    it('should filter by category', async () => {
      await createTestProduct({ categoryId: testCategory.id });
      const response = await request(app)
        .get(`/api/products?categoryId=${testCategory.id}`)
        .expect(200);
      expect(response.body.products.length).toBeGreaterThan(0);
    });

    it('should filter by price range', async () => {
      await createTestProduct({ categoryId: testCategory.id, price: '50.00' });
      const response = await request(app)
        .get('/api/products?minPrice=40&maxPrice=60')
        .expect(200);
      expect(response.body.products.length).toBeGreaterThan(0);
    });

    it('should filter by search query', async () => {
      await createTestProduct({ categoryId: testCategory.id, name: 'UniqueProduct' });
      const response = await request(app)
        .get('/api/products?search=Unique')
        .expect(200);
      expect(response.body.products.length).toBeGreaterThan(0);
    });

    it('should sort by newest', async () => {
      const response = await request(app).get('/api/products?sortBy=newest').expect(200);
      expect(response.body).toHaveProperty('products');
    });

    it('should sort by price-asc', async () => {
      const response = await request(app).get('/api/products?sortBy=price-asc').expect(200);
      expect(response.body).toHaveProperty('products');
    });

    it('should sort by price-desc', async () => {
      const response = await request(app).get('/api/products?sortBy=price-desc').expect(200);
      expect(response.body).toHaveProperty('products');
    });

    it('should sort by rating', async () => {
      const response = await request(app).get('/api/products?sortBy=rating').expect(200);
      expect(response.body).toHaveProperty('products');
    });

    it('should return empty when no products', async () => {
      const response = await request(app).get('/api/products').expect(200);
      expect(response.body.products).toEqual([]);
    });
  });

  describe('GET /api/products/featured', () => {
    it('should retrieve only featured products', async () => {
      await createTestProduct({ categoryId: testCategory.id, isFeatured: true });
      await createTestProduct({ categoryId: testCategory.id, isFeatured: false });
      const response = await request(app).get('/api/products/featured').expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return empty array when no featured', async () => {
      const response = await request(app).get('/api/products/featured').expect(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/products/category/:categoryId', () => {
    it('should retrieve products by category', async () => {
      await createTestProduct({ categoryId: testCategory.id });
      const response = await request(app).get(`/api/products/category/${testCategory.id}`).expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return empty for category with no products', async () => {
      const cat = await createTestCategory();
      const response = await request(app).get(`/api/products/category/${cat.id}`).expect(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should retrieve product by ID', async () => {
      const product = await createTestProduct({ categoryId: testCategory.id });
      const response = await request(app).get(`/api/products/${product.id}`).expect(200);
      expect(response.body).toHaveProperty('id', product.id);
      expect(response.body).toHaveProperty('category');
    });

    it('should return 404 for non-existent product', async () => {
      await request(app).get('/api/products/non-existent').expect(404);
    });
  });

  describe('POST /api/products', () => {
    it('should create product with admin token', async () => {
      const data = {
        name: 'New Product',
        description: 'Test',
        price: '99.99',
        stockQuantity: 100,
        categoryId: testCategory.id,
        unit: 'KG',
        images: ['https://example.com/image.jpg'],
      };
      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data)
        .expect(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should return 401 without auth', async () => {
      await request(app).post('/api/products').send({}).expect(401);
    });

    it('should return 403 with customer token', async () => {
      await request(app).post('/api/products').set('Authorization', `Bearer ${customerToken}`).send({}).expect(403);
    });

    it('should return 400 for missing fields', async () => {
      await request(app).post('/api/products').set('Authorization', `Bearer ${adminToken}`).send({}).expect(400);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product with admin token', async () => {
      const product = await createTestProduct({ categoryId: testCategory.id });
      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' })
        .expect(200);
      expect(response.body.name).toBe('Updated');
    });

    it('should return 401 without auth', async () => {
      const product = await createTestProduct({ categoryId: testCategory.id });
      await request(app).put(`/api/products/${product.id}`).send({}).expect(401);
    });

    it('should return 403 with customer token', async () => {
      const product = await createTestProduct({ categoryId: testCategory.id });
      await request(app).put(`/api/products/${product.id}`).set('Authorization', `Bearer ${customerToken}`).send({}).expect(403);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app).put('/api/products/non-existent').set('Authorization', `Bearer ${adminToken}`).send({}).expect(404);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product with admin token', async () => {
      const product = await createTestProduct({ categoryId: testCategory.id });
      const response = await request(app)
        .delete(`/api/products/${product.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
      expect(response.body).toEqual({});
    });

    it('should return 401 without auth', async () => {
      const product = await createTestProduct({ categoryId: testCategory.id });
      await request(app).delete(`/api/products/${product.id}`).expect(401);
    });

    it('should return 403 with customer token', async () => {
      const product = await createTestProduct({ categoryId: testCategory.id });
      await request(app).delete(`/api/products/${product.id}`).set('Authorization', `Bearer ${customerToken}`).expect(403);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app).delete('/api/products/non-existent').set('Authorization', `Bearer ${adminToken}`).expect(404);
    });
  });
});

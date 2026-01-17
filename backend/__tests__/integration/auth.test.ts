import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../src/app';
import { generateAccessTokenWithExpiry } from '../helpers/auth.helper';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Authentication Integration Tests', () => {
  beforeAll(async () => {
    // Ensure database connection is established
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up and disconnect
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-',
        },
      },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-',
        },
      },
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test-register@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1234567890',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user).not.toHaveProperty('password');

      // Verify user was created in database
      const createdUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(createdUser).toBeTruthy();
      expect(createdUser?.email).toBe(userData.email);

      // Verify password was hashed
      const passwordMatch = await bcrypt.compare(userData.password, createdUser!.password);
      expect(passwordMatch).toBe(true);

      // Verify refresh token was stored
      expect(createdUser?.refreshToken).toBeTruthy();
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        email: 'test-duplicate@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1234567891',
      };

      // Create user first
      await request(app).post('/api/auth/register').send(userData).expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, phoneNumber: '+1234567892' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('email');
    });

    it('should return 400 for duplicate phone number', async () => {
      const userData1 = {
        email: 'test-user1@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User1',
        phoneNumber: '+1234567893',
      };

      const userData2 = {
        email: 'test-user2@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User2',
        phoneNumber: '+1234567893', // Same phone number
      };

      await request(app).post('/api/auth/register').send(userData1).expect(201);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData2)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('phone');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test-incomplete@example.com',
          // Missing password, firstName, lastName
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should assign CUSTOMER role by default', async () => {
      const userData = {
        email: 'test-role@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1234567894',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.role).toBe('CUSTOMER');
    });
  });

  describe('POST /api/auth/login', () => {
    const testUser = {
      email: 'test-login@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+1234567895',
    };

    beforeEach(async () => {
      // Create a test user before each login test
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');

      // Verify refresh token was updated in database
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
      });
      expect(user?.refreshToken).toBeTruthy();
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing email or password', async () => {
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({
          password: testUser.password,
        })
        .expect(400);

      expect(response1.body).toHaveProperty('error');

      const response2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
        })
        .expect(400);

      expect(response2.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let refreshToken: string;
    let userId: string;

    beforeEach(async () => {
      // Register and get refresh token
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test-refresh@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          phoneNumber: '+1234567896',
        });

      refreshToken = response.body.refreshToken;
      userId = response.body.user.id;
    });

    it('should refresh tokens successfully with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.refreshToken).not.toBe(refreshToken);

      // Verify old refresh token was replaced
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(user?.refreshToken).not.toBe(refreshToken);
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 for token that does not match stored token', async () => {
      // Generate a valid token but not stored in database
      const fakeToken = generateRefreshToken(userId, 'CUSTOMER');

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: fakeToken })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test-logout@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          phoneNumber: '+1234567897',
        });

      accessToken = response.body.accessToken;
      userId = response.body.user.id;
    });

    it('should logout successfully with valid access token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify refresh token was removed from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(user?.refreshToken).toBeNull();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).post('/api/auth/logout').expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;
    let testUser: any;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test-me@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          phoneNumber: '+1234567898',
        });

      accessToken = response.body.accessToken;
      testUser = response.body.user;
    });

    it('should return current user data successfully', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('email', testUser.email);
      expect(response.body).toHaveProperty('firstName', testUser.firstName);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/auth/me').expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 with expired token', async () => {
      // Generate an expired token (expires in -1 hour)
      const expiredToken = generateAccessTokenWithExpiry(testUser.id, testUser.role, '-1h');

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/auth/fcm-token', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test-fcm@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          phoneNumber: '+1234567899',
        });

      accessToken = response.body.accessToken;
      userId = response.body.user.id;
    });

    it('should update FCM token successfully', async () => {
      const fcmToken = 'test-fcm-token-123';

      const response = await request(app)
        .put('/api/auth/fcm-token')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ fcmToken })
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify FCM token was stored in database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(user?.fcmToken).toBe(fcmToken);
    });

    it('should return 400 for missing FCM token', async () => {
      const response = await request(app)
        .put('/api/auth/fcm-token')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/auth/fcm-token')
        .send({ fcmToken: 'test-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/auth/fcm-token', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test-fcm-delete@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          phoneNumber: '+1234567800',
        });

      accessToken = response.body.accessToken;
      userId = response.body.user.id;

      // Set FCM token first
      await request(app)
        .put('/api/auth/fcm-token')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ fcmToken: 'test-fcm-token' });
    });

    it('should remove FCM token successfully', async () => {
      const response = await request(app)
        .delete('/api/auth/fcm-token')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify FCM token was removed from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(user?.fcmToken).toBeNull();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).delete('/api/auth/fcm-token').expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});

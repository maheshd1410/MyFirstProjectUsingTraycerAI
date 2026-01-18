// @ts-nocheck
import { AuthService } from '../../src/services/auth.service';
import { prismaMock } from '../mocks/prisma.mock';
import { createMockUser, TEST_USER_EMAIL, TEST_USER_PHONE, TEST_PASSWORD } from '../helpers/test-data';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

// Mock bcrypt
jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register()', () => {
    const registerData = {
      email: TEST_USER_EMAIL,
      phoneNumber: TEST_USER_PHONE,
      password: TEST_PASSWORD,
      firstName: 'Test',
      lastName: 'User',
    };

    it('should successfully register a user with valid data', async () => {
      const hashedPassword = '$2b$10$hashedpassword';
      const mockUser = createMockUser({ password: hashedPassword });

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.findFirst.mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue(hashedPassword as never);
      prismaMock.user.create.mockResolvedValue(mockUser);

      const result = await authService.register(registerData);

      expect(bcryptMock.hash).toHaveBeenCalledWith(TEST_PASSWORD, 10);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: registerData.email,
          phoneNumber: registerData.phoneNumber,
          password: hashedPassword,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          role: UserRole.CUSTOMER,
        },
      });
      expect(result).toEqual(expect.objectContaining({
        email: TEST_USER_EMAIL,
        phoneNumber: TEST_USER_PHONE,
      }));
      expect(result).not.toHaveProperty('password');
    });

    it('should reject duplicate email', async () => {
      const existingUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(existingUser);

      await expect(authService.register(registerData)).rejects.toThrow('Email already registered');
    });

    it('should reject duplicate phone number', async () => {
      const existingUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(existingUser);

      await expect(authService.register(registerData)).rejects.toThrow('Phone number already registered');
    });

    it('should hash the password', async () => {
      const hashedPassword = '$2b$10$hashedpassword';
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.findFirst.mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue(hashedPassword as never);
      prismaMock.user.create.mockResolvedValue(createMockUser({ password: hashedPassword }));

      await authService.register(registerData);

      expect(bcryptMock.hash).toHaveBeenCalledWith(TEST_PASSWORD, 10);
    });

    it('should assign default role as CUSTOMER when not specified', async () => {
      const hashedPassword = '$2b$10$hashedpassword';
      prismaMock.user.findUnique.mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue(hashedPassword as never);
      prismaMock.user.create.mockResolvedValue(createMockUser({ role: UserRole.CUSTOMER }));

      await authService.register(registerData);

      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: UserRole.CUSTOMER,
          }),
        })
      );
    });

    it('should exclude password from returned user object', async () => {
      const hashedPassword = '$2b$10$hashedpassword';
      prismaMock.user.findUnique.mockResolvedValue(null);
      bcryptMock.hash.mockResolvedValue(hashedPassword as never);
      prismaMock.user.create.mockResolvedValue(createMockUser({ password: hashedPassword }));

      const result = await authService.register(registerData);

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('login()', () => {
    const loginData = {
      email: TEST_USER_EMAIL,
      password: TEST_PASSWORD,
    };

    it('should successfully login with correct credentials', async () => {
      const mockUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(true as never);

      const result = await authService.login(loginData.email, loginData.password);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email },
      });
      expect(bcryptMock.compare).toHaveBeenCalledWith(loginData.password, mockUser.password);
      expect(result).toEqual(expect.objectContaining({
        email: TEST_USER_EMAIL,
      }));
      expect(result).not.toHaveProperty('password');
    });

    it('should fail login with non-existent email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginData.email, loginData.password)).rejects.toThrow(
        'User not found'
      );
    });

    it('should fail login with incorrect password', async () => {
      const mockUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(false as never);

      await expect(authService.login(loginData.email, loginData.password)).rejects.toThrow(
        'Invalid password'
      );
    });

    it('should return user object without password', async () => {
      const mockUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(true as never);

      const result = await authService.login(loginData.email, loginData.password);

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('getUserById()', () => {
    it('should successfully retrieve user by ID', async () => {
      const mockUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.getUserById('user-1');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual(expect.objectContaining({
        id: 'user-1',
      }));
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.getUserById('non-existent-id')).rejects.toThrow('User not found');
    });

    it('should exclude password from returned object', async () => {
      const mockUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.getUserById('user-1');

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('updateRefreshToken()', () => {
    it('should update refresh token in database', async () => {
      const refreshToken = 'new-refresh-token';
      prismaMock.user.update.mockResolvedValue(createMockUser({ refreshToken }));

      await authService.updateRefreshToken('user-1', refreshToken);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshToken },
      });
    });

    it('should update refresh token to null for logout', async () => {
      prismaMock.user.update.mockResolvedValue(createMockUser({ refreshToken: null }));

      await authService.updateRefreshToken('user-1', null);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshToken: null },
      });
    });
  });

  describe('verifyStoredRefreshToken()', () => {
    it('should successfully verify when tokens match', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockUser = createMockUser({ refreshToken });
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.verifyStoredRefreshToken('user-1', refreshToken);

      expect(result).toBe(true);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { refreshToken: true },
      });
    });

    it('should fail when tokens do not match', async () => {
      const mockUser = createMockUser({ refreshToken: 'different-token' });
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.verifyStoredRefreshToken('user-1', 'invalid-token');

      expect(result).toBe(false);
    });

    it('should fail when user has no stored token', async () => {
      const mockUser = createMockUser({ refreshToken: null });
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.verifyStoredRefreshToken('user-1', 'some-token');

      expect(result).toBe(false);
    });

    it('should fail when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await authService.verifyStoredRefreshToken('non-existent-id', 'some-token');

      expect(result).toBe(false);
    });
  });

  describe('updateFcmToken()', () => {
    it('should update FCM token', async () => {
      const fcmToken = 'new-fcm-token';
      prismaMock.user.update.mockResolvedValue(createMockUser({ fcmToken }));

      await authService.updateFcmToken('user-1', fcmToken);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { fcmToken },
      });
    });

    it('should remove FCM token when null value provided', async () => {
      prismaMock.user.update.mockResolvedValue(createMockUser({ fcmToken: null }));

      await authService.updateFcmToken('user-1', null);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { fcmToken: null },
      });
    });
  });

  describe('updateUserProfile()', () => {
    it('should successfully update profile with firstName and lastName', async () => {
      const updates = { firstName: 'Updated', lastName: 'Name' };
      const updatedUser = createMockUser(updates);
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const result = await authService.updateUserProfile('user-1', updates);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: updates,
      });
      expect(result).toEqual(expect.objectContaining(updates));
      expect(result).not.toHaveProperty('password');
    });

    it('should update phoneNumber with uniqueness validation', async () => {
      const newPhone = '+9876543210';
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.update.mockResolvedValue(createMockUser({ phoneNumber: newPhone }));

      await authService.updateUserProfile('user-1', { phoneNumber: newPhone });

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          phoneNumber: newPhone,
          id: { not: 'user-1' },
        },
      });
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { phoneNumber: newPhone },
        })
      );
    });

    it('should reject duplicate phoneNumber', async () => {
      const newPhone = '+9876543210';
      const existingUser = createMockUser({ id: 'other-user', phoneNumber: newPhone });
      prismaMock.user.findFirst.mockResolvedValue(existingUser);

      await expect(authService.updateUserProfile('user-1', { phoneNumber: newPhone })).rejects.toThrow(
        'Phone number already in use'
      );
    });

    it('should handle partial updates', async () => {
      const updates = { firstName: 'OnlyFirstName' };
      prismaMock.user.update.mockResolvedValue(createMockUser(updates));

      const result = await authService.updateUserProfile('user-1', updates);

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: updates,
        })
      );
      expect(result.firstName).toBe('OnlyFirstName');
    });
  });
});

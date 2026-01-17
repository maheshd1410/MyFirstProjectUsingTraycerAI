import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import { RegisterDTO } from '../types';
import { emailService } from './email.service';
import logger from '../config/logger';

export class AuthService {
  /**
   * Register a new user with email and password
   */
  async register(data: RegisterDTO) {
    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Check if user with phone number already exists
    const existingPhone = await prisma.user.findUnique({
      where: { phoneNumber: data.phoneNumber },
    });

    if (existingPhone) {
      throw new Error('Phone number already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        role: data.role || UserRole.CUSTOMER,
      },
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({ email: user.email, fullName: `${user.firstName} ${user.lastName}` });
      logger.info('Welcome email queued', { userId: user.id });
    } catch (error) {
      logger.error('Failed to queue welcome email', { userId: user.id, error });
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Login user and verify password with account lockout protection
   */
  async login(email: string, password: string) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new Error(`Account is locked. Please try again in ${remainingTime} minutes`);
    }

    // If lockout period has expired, reset failed attempts
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastFailedLogin: null,
        },
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const maxAttempts = 5;
      const lockoutDuration = 15 * 60 * 1000; // 15 minutes in milliseconds

      // Check if account should be locked
      if (failedAttempts >= maxAttempts) {
        const lockedUntil = new Date(Date.now() + lockoutDuration);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: failedAttempts,
            lockedUntil: lockedUntil,
            lastFailedLogin: new Date(),
          },
        });
        throw new Error(`Account locked due to too many failed login attempts. Please try again in 15 minutes`);
      }

      // Update failed attempts
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lastFailedLogin: new Date(),
        },
      });

      const remainingAttempts = maxAttempts - failedAttempts;
      throw new Error(`Invalid password. ${remainingAttempts} attempts remaining`);
    }

    // Successful login - reset failed attempts and lockout
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastFailedLogin: null,
      },
    });

    return user;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update refresh token for user
   */
  async updateRefreshToken(userId: string, refreshToken: string | null) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });

    return user;
  }

  /**
   * Verify refresh token matches the stored token for a user
   */
  async verifyStoredRefreshToken(userId: string, providedToken: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { refreshToken: true },
    });

    if (!user || !user.refreshToken) {
      return false;
    }

    // Compare the provided token with the stored token
    return user.refreshToken === providedToken;
  }

  /**
   * Update FCM token for push notifications
   */
  async updateFcmToken(userId: string, fcmToken: string | null) {
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });
  }

  /**
   * Update user profile (firstName, lastName, phoneNumber)
   */
  async updateUserProfile(userId: string, data: { firstName?: string; lastName?: string; phoneNumber?: string }) {
    // If phoneNumber is being updated, check if it's already taken by another user
    if (data.phoneNumber) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phoneNumber: data.phoneNumber,
          id: { not: userId },
        },
      });

      if (existingPhone) {
        throw new Error('Phone number already in use');
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
      },
    });

    // Return user without sensitive fields
    const { password, refreshToken, fcmToken, ...userWithoutSensitiveFields } = user;
    return userWithoutSensitiveFields;
  }

  /**
   * Update user profile image
   */
  async updateProfileImage(userId: string, imageUrl: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { profileImage: imageUrl },
    });

    // Return user without sensitive fields
    const { password, refreshToken, fcmToken, ...userWithoutSensitiveFields } = user;
    return userWithoutSensitiveFields;
  }
}

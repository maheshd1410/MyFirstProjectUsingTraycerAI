import bcrypt from 'bcrypt';
import { UserRole, AuthProvider } from '@prisma/client';
import { prisma } from '../config/database';
import { RegisterDTO, OAuthUserProfile, OAuthProvider } from '../types';
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
   * Login user with email/password; rejects OAuth-only accounts and enforces lockout protection.
   */
  async login(email: string, password: string) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // OAuth-only accounts cannot use email/password login
    // This prevents bcrypt.compare on empty hashes and provides a clear UX message.
    if (!user.isEmailPasswordSet) {
      throw new Error('This account uses OAuth authentication only. Please sign in using Google or Apple');
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

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
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

  /**
   * Find or create OAuth user
   */
  async findOrCreateOAuthUser(profile: OAuthUserProfile, provider: OAuthProvider) {
    const providerId = provider === 'google' ? 'googleId' : 'appleId';
    const authProvider = provider === 'google' ? AuthProvider.GOOGLE : AuthProvider.APPLE;
    let isNewUser = false;

    // Check if user exists by provider ID
    const existingUserByProviderId = await prisma.user.findFirst({
      where: {
        [providerId]: profile.id,
      },
    });

    if (existingUserByProviderId) {
      return { user: existingUserByProviderId, isNewUser: false };
    }

    // Check if user exists by email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (existingUserByEmail) {
      // If user has password set, they must login and link account manually
      if (existingUserByEmail.isEmailPasswordSet) {
        throw new Error('Email already registered. Please login and link account from settings');
      }

      // Link OAuth provider to existing account
      const updatedUser = await prisma.user.update({
        where: { id: existingUserByEmail.id },
        data: {
          [providerId]: profile.id,
          authProvider,
          emailVerified: true,
          ...(profile.profileImage && !existingUserByEmail.profileImage && { profileImage: profile.profileImage }),
        },
      });

      return { user: updatedUser, isNewUser: false };
    }

    // Create new user with OAuth provider
    isNewUser = true;
    const newUser = await prisma.user.create({
      data: {
        email: profile.email,
        password: await bcrypt.hash('oauth-placeholder', 10),
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: `+${Date.now()}`, // Temporary phone number, will be updated later
        role: UserRole.CUSTOMER,
        authProvider,
        [providerId]: profile.id,
        emailVerified: true,
        isEmailPasswordSet: false,
        profileImage: profile.profileImage,
      },
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail({ email: newUser.email, fullName: `${newUser.firstName} ${newUser.lastName}` });
      logger.info('Welcome email queued for OAuth user', { userId: newUser.id });
    } catch (error) {
      logger.error('Failed to queue welcome email for OAuth user', { userId: newUser.id, error });
    }

    return { user: newUser, isNewUser };
  }

  /**
   * Link OAuth provider to existing user account
   */
  async linkOAuthProvider(userId: string, profile: OAuthUserProfile, provider: OAuthProvider) {
    const providerId = provider === 'google' ? 'googleId' : 'appleId';

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if provider already linked to this user
    if (user[providerId as keyof typeof user]) {
      throw new Error(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account already linked`);
    }

    // Check if provider ID is linked to another user
    const existingUserWithProvider = await prisma.user.findFirst({
      where: {
        [providerId]: profile.id,
        id: { not: userId },
      },
    });

    if (existingUserWithProvider) {
      throw new Error(`This ${provider} account is already linked to another user`);
    }

    // Link provider to user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        [providerId]: profile.id,
        emailVerified: true,
      },
    });

    const { password, refreshToken, fcmToken, ...userWithoutSensitiveFields } = updatedUser;
    return userWithoutSensitiveFields;
  }

  /**
   * Unlink OAuth provider from user account
   */
  async unlinkOAuthProvider(userId: string, provider: OAuthProvider) {
    const providerId = provider === 'google' ? 'googleId' : 'appleId';

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if provider is linked
    if (!user[providerId as keyof typeof user]) {
      throw new Error(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account is not linked`);
    }

    // Ensure user has at least one authentication method
    const hasPassword = user.isEmailPasswordSet;
    const hasGoogle = user.googleId !== null;
    const hasApple = user.appleId !== null;
    const authMethodsCount = [hasPassword, hasGoogle, hasApple].filter(Boolean).length;

    if (authMethodsCount <= 1) {
      throw new Error('Cannot unlink. You must have at least one authentication method');
    }

    // Unlink provider
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        [providerId]: null,
      },
    });

    const { password, refreshToken, fcmToken, ...userWithoutSensitiveFields } = updatedUser;
    return userWithoutSensitiveFields;
  }

  /**
   * Get user by provider ID
   */
  async getUserByProviderId(providerId: string, provider: OAuthProvider) {
    const field = provider === 'google' ? 'googleId' : 'appleId';

    const user = await prisma.user.findFirst({
      where: {
        [field]: providerId,
      },
    });

    return user;
  }
}

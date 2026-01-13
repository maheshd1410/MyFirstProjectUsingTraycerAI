import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/database';
import { RegisterDTO } from '../types';

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

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Login user and verify password
   */
  async login(email: string, password: string) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

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
}

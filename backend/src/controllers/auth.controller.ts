import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { RegisterDTO, LoginDTO, AuthResponse } from '../types';

const authService = new AuthService();

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response) => {
  try {
    const data: RegisterDTO = req.body;

    // Basic validation
    if (!data.email || !data.password || !data.firstName || !data.lastName || !data.phoneNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Register user
    const user = await authService.register(data);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in database
    await authService.updateRefreshToken(user.id, refreshToken);

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };

    return res.status(201).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return res.status(400).json({ error: message });
  }
};

/**
 * Login user with email and password
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginDTO = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Authenticate user
    const user = await authService.login(email, password);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in database
    await authService.updateRefreshToken(user.id, refreshToken);

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };

    return res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return res.status(401).json({ error: message });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token signature
    const decoded = verifyRefreshToken(token);

    // Get user
    const user = await authService.getUserById(decoded.userId);

    // Validate that the provided token matches the stored token
    const isStoredTokenValid = await authService.verifyStoredRefreshToken(decoded.userId, token);
    if (!isStoredTokenValid) {
      return res.status(401).json({ error: 'Invalid refresh token - token does not match stored value' });
    }

    // Generate new access token and refresh token (token rotation)
    const newAccessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    // Save new refresh token in database
    await authService.updateRefreshToken(user.id, newRefreshToken);

    // Return both tokens
    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    return res.status(401).json({ error: message });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Clear refresh token from database
    await authService.updateRefreshToken(req.user.userId, null);

    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    return res.status(500).json({ error: message });
  }
};

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await authService.getUserById(req.user.userId);

    return res.status(200).json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    return res.status(500).json({ error: message });
  }
};

/**
 * Update FCM token for push notifications
 * PUT /api/auth/fcm-token
 */
export const updateFcmToken = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { fcmToken } = req.body;

    if (!fcmToken || typeof fcmToken !== 'string') {
      return res.status(400).json({ error: 'Valid FCM token is required' });
    }

    await authService.updateFcmToken(req.user.userId, fcmToken);

    return res.status(200).json({ message: 'FCM token updated successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update FCM token';
    return res.status(500).json({ error: message });
  }
};

/**
 * Remove FCM token (on logout)
 * DELETE /api/auth/fcm-token
 */
export const removeFcmToken = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await authService.updateFcmToken(req.user.userId, null);

    return res.status(200).json({ message: 'FCM token removed successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove FCM token';
    return res.status(500).json({ error: message });
  }
};

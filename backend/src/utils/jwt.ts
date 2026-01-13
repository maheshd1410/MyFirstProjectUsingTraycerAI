import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

interface TokenPayload extends JwtPayload {
  userId: string;
  role: UserRole;
}

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d';

/**
 * Generate access token with 7-day expiry
 */
export function generateAccessToken(userId: string, role: UserRole): string {
  const signOptions: SignOptions = {
    expiresIn: '7d',
  };
  return jwt.sign({ userId, role }, JWT_SECRET, signOptions);
}

/**
 * Generate refresh token with 30-day expiry
 */
export function generateRefreshToken(userId: string): string {
  const signOptions: SignOptions = {
    expiresIn: '30d',
  };
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, signOptions);
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw error;
  }
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

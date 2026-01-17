import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

/**
 * Generate test JWT access token
 */
export function generateTestTokens(userId: string, role: string = 'CUSTOMER') {
  const accessTokenSecret = process.env.JWT_SECRET || 'test-jwt-secret';
  const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

  const accessToken = jwt.sign(
    { userId, role },
    accessTokenSecret,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, role },
    refreshTokenSecret,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

/**
 * Generate Authorization headers with Bearer token
 */
export function createAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Hash password for creating test users
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Generate refresh token (calls generateRefreshTokenWithExpiry with 7d)
 */
export function generateRefreshToken(userId: string, role: string = 'CUSTOMER'): string {
  return generateRefreshTokenWithExpiry(userId, role, '7d');
}

/**
 * Generate expired access token for testing
 */
export function generateExpiredToken(userId: string, role: string = 'CUSTOMER'): string {
  const accessTokenSecret = process.env.JWT_SECRET || 'test-jwt-secret';

  return jwt.sign(
    { userId, role },
    accessTokenSecret,
    { expiresIn: '-1h' } // Expired 1 hour ago
  );
}

/**
 * Generate access token with custom expiry
 */
export function generateAccessTokenWithExpiry(
  userId: string,
  role: string = 'CUSTOMER',
  expiresIn: string = '15m'
): string {
  const accessTokenSecret = process.env.JWT_SECRET || 'test-jwt-secret';

  return jwt.sign(
    { userId, role },
    accessTokenSecret,
    { expiresIn }
  );
}

/**
 * Generate refresh token with custom expiry
 */
export function generateRefreshTokenWithExpiry(
  userId: string,
  role: string = 'CUSTOMER',
  expiresIn: string = '7d'
): string {
  const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

  return jwt.sign(
    { userId, role },
    refreshTokenSecret,
    { expiresIn }
  );
}

/**
 * Decode JWT token without verification (for testing)
 */
export function decodeToken(token: string): any {
  return jwt.decode(token);
}

/**
 * Verify JWT token
 */
export function verifyAccessToken(token: string): any {
  const accessTokenSecret = process.env.JWT_SECRET || 'test-jwt-secret';
  return jwt.verify(token, accessTokenSecret);
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): any {
  const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
  return jwt.verify(token, refreshTokenSecret);
}

/**
 * Generate admin tokens for testing admin endpoints
 */
export function generateAdminTokens(userId: string) {
  return generateTestTokens(userId, 'ADMIN');
}

/**
 * Generate vendor tokens for testing vendor endpoints
 */
export function generateVendorTokens(userId: string) {
  return generateTestTokens(userId, 'VENDOR');
}

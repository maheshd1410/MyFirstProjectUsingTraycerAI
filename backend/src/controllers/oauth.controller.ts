import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { OAuthUserProfile } from '../types';
import logger from '../config/logger';
import axios from 'axios';

const authService = new AuthService();

export const oauthController = {
  /**
   * Initiate Google OAuth flow
   */
  googleAuth: passport.authenticate('google', { scope: ['profile', 'email'], session: false }),

  /**
   * Handle Google OAuth callback
   */
  googleCallback: async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', { session: false }, async (err: Error, profile: OAuthUserProfile) => {
      try {
        if (err || !profile) {
          logger.error('Google OAuth authentication failed', { error: err });
          const redirectUrl = `${process.env.OAUTH_REDIRECT_URI}?error=authentication_failed&message=${encodeURIComponent('Google authentication failed')}`;
          return res.redirect(redirectUrl);
        }

        const { user, isNewUser } = await authService.findOrCreateOAuthUser(profile, 'google');

        // Generate JWT tokens
        const jwtSecret = process.env.JWT_SECRET || 'default-secret';
        const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
        const accessToken = jwt.sign(
          { userId: user.id, role: user.role },
          jwtSecret,
          { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
        );

        const refreshToken = jwt.sign(
          { userId: user.id },
          jwtRefreshSecret,
          { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' } as jwt.SignOptions
        );

        // Store refresh token in database
        await authService.updateRefreshToken(user.id, refreshToken);

        logger.info('Google OAuth login successful', { userId: user.id, isNewUser });

        // Redirect to mobile app with tokens
        const redirectUrl = `${process.env.OAUTH_REDIRECT_URI}?token=${accessToken}&refreshToken=${refreshToken}&isNewUser=${isNewUser}`;
        return res.redirect(redirectUrl);
      } catch (error: any) {
        logger.error('Google OAuth callback error', { error: error.message });
        
        let errorMessage = 'Authentication failed';
        if (error.message.includes('Email already registered')) {
          errorMessage = 'Email already registered. Please login and link account from settings';
        }

        const redirectUrl = `${process.env.OAUTH_REDIRECT_URI}?error=oauth_error&message=${encodeURIComponent(errorMessage)}`;
        return res.redirect(redirectUrl);
      }
    })(req, res, next);
  },

  /**
   * Initiate Apple OAuth flow
   */
  appleAuth: passport.authenticate('apple', { scope: ['name', 'email'], session: false }),

  /**
   * Handle Apple OAuth callback
   */
  appleCallback: async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('apple', { session: false }, async (err: Error, profile: OAuthUserProfile) => {
      try {
        if (err || !profile) {
          logger.error('Apple OAuth authentication failed', { error: err });
          const redirectUrl = `${process.env.OAUTH_REDIRECT_URI}?error=authentication_failed&message=${encodeURIComponent('Apple authentication failed')}`;
          return res.redirect(redirectUrl);
        }

        // Find or create user
        const { user, isNewUser } = await authService.findOrCreateOAuthUser(profile, 'apple');

        // Generate JWT tokens
        const jwtSecret = process.env.JWT_SECRET || 'default-secret';
        const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
        const accessToken = jwt.sign(
          { userId: user.id, role: user.role },
          jwtSecret,
          { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
        );

        const refreshToken = jwt.sign(
          { userId: user.id },
          jwtRefreshSecret,
          { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' } as jwt.SignOptions
        );

        // Store refresh token in database
        await authService.updateRefreshToken(user.id, refreshToken);

        logger.info('Apple OAuth login successful', { userId: user.id, isNewUser });

        // Redirect to mobile app with tokens
        const redirectUrl = `${process.env.OAUTH_REDIRECT_URI}?token=${accessToken}&refreshToken=${refreshToken}&isNewUser=${isNewUser}`;
        return res.redirect(redirectUrl);
      } catch (error: any) {
        logger.error('Apple OAuth callback error', { error: error.message });
        
        let errorMessage = 'Authentication failed';
        if (error.message.includes('Email already registered')) {
          errorMessage = 'Email already registered. Please login and link account from settings';
        }

        const redirectUrl = `${process.env.OAUTH_REDIRECT_URI}?error=oauth_error&message=${encodeURIComponent(errorMessage)}`;
        return res.redirect(redirectUrl);
      }
    })(req, res, next);
  },

  /**
   * Link OAuth account to existing user
   */
  linkOAuthAccount: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { provider, accessToken } = req.body;

      if (!provider || !accessToken) {
        return res.status(400).json({ error: 'Provider and access token are required' });
      }

      if (provider !== 'google' && provider !== 'apple') {
        return res.status(400).json({ error: 'Invalid provider. Must be google or apple' });
      }

      let oauthProfile: OAuthUserProfile;

      // Verify access token and get user profile from OAuth provider
      try {
        if (provider === 'google') {
          const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          oauthProfile = {
            id: response.data.id,
            email: response.data.email,
            firstName: response.data.given_name || '',
            lastName: response.data.family_name || '',
            profileImage: response.data.picture,
          };
        } else if (provider === 'apple') {
          // For Apple, accept the appleId and email from the request body
          // The mobile app should pass these during OAuth linking
          oauthProfile = {
            id: (req.body as any).appleId || 'unknown',
            email: (req.body as any).email || '',
            firstName: (req.body as any).firstName || '',
            lastName: (req.body as any).lastName || '',
          };
        } else {
          throw new Error('Unsupported provider');
        }
      } catch (tokenError: any) {
        logger.warn('OAuth token verification failed', { provider, error: tokenError.message });
        return res.status(401).json({ error: 'Invalid access token' });
      }

      // Link OAuth provider to user account
      const user = await authService.linkOAuthProvider(userId, oauthProfile, provider);

      logger.info('OAuth account linked successfully', { userId, provider });

      return res.status(200).json({
        message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account linked successfully`,
        user,
      });
    } catch (error: any) {
      logger.error('Link OAuth account error', { error: error.message, userId: req.user?.userId });
      
      if (error.message.includes('already linked') || error.message.includes('already linked to another user')) {
        return res.status(409).json({ error: error.message });
      }

      return res.status(500).json({ error: 'Failed to link OAuth account' });
    }
  },

  /**
   * Unlink OAuth account from user
   */
  unlinkOAuthAccount: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { provider } = req.params;

      if (provider !== 'google' && provider !== 'apple') {
        return res.status(400).json({ error: 'Invalid provider. Must be google or apple' });
      }

      const user = await authService.unlinkOAuthProvider(userId, provider);

      logger.info('OAuth account unlinked successfully', { userId, provider });

      return res.status(200).json({
        message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked successfully`,
        user,
      });
    } catch (error: any) {
      logger.error('Unlink OAuth account error', { error: error.message, userId: req.user?.userId });
      
      if (error.message.includes('not linked') || error.message.includes('at least one')) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: 'Failed to unlink OAuth account' });
    }
  },
};

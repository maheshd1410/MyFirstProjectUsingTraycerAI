import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { oauthController } from '../controllers/oauth.controller';
import { authenticate } from '../middleware/auth';
import { validateRegister, validateLogin, validate } from '../middleware/validators/auth.validator';
import { csrfProtection } from '../middleware/csrf';

const router = Router();

/**
 * @swagger
 * /api/auth/csrf-token:
 *   get:
 *     summary: Get CSRF token
 *     tags: [Authentication]
 *     description: Retrieve a CSRF token for state-changing operations
 *     responses:
 *       200:
 *         description: CSRF token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 csrfToken:
 *                   type: string
 */
router.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: (req as any).csrfToken });
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// CSRF removed: register is a public endpoint, no session/auth yet
router.post('/register', validateRegister, validate, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// CSRF removed: login is a public endpoint, no session/auth yet
router.post('/login', validateLogin, validate, authController.login);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', csrfProtection, authenticate, authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @swagger
 * /api/auth/fcm-token:
 *   put:
 *     summary: Update FCM token for push notifications
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *             properties:
 *               fcmToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: FCM token updated
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/fcm-token', csrfProtection, authenticate, authController.updateFcmToken);

/**
 * @swagger
 * /api/auth/fcm-token:
 *   delete:
 *     summary: Remove FCM token
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: FCM token removed
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/fcm-token', csrfProtection, authenticate, authController.removeFcmToken);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Authentication]
 *     description: Redirects to Google OAuth consent screen
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get('/google', oauthController.googleAuth);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     description: Handles Google OAuth callback and redirects to mobile app with tokens
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Authorization code from Google
 *     responses:
 *       302:
 *         description: Redirect to mobile app with tokens or error
 */
router.get('/google/callback', oauthController.googleCallback);

/**
 * @swagger
 * /api/auth/apple:
 *   get:
 *     summary: Initiate Apple OAuth login
 *     tags: [Authentication]
 *     description: Redirects to Apple OAuth consent screen
 *     responses:
 *       302:
 *         description: Redirect to Apple OAuth
 */
router.get('/apple', oauthController.appleAuth);

/**
 * @swagger
 * /api/auth/apple/callback:
 *   get:
 *     summary: Apple OAuth callback
 *     tags: [Authentication]
 *     description: Handles Apple OAuth callback and redirects to mobile app with tokens
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Authorization code from Apple
 *     responses:
 *       302:
 *         description: Redirect to mobile app with tokens or error
 */
router.get('/apple/callback', oauthController.appleCallback);

/**
 * @swagger
 * /api/auth/oauth/link:
 *   post:
 *     summary: Link OAuth account to existing user
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - accessToken
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [google, apple]
 *               accessToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: OAuth account linked successfully
 *       400:
 *         description: Invalid request
 *       409:
 *         description: Account already linked
 */
router.post('/oauth/link', authenticate, csrfProtection, oauthController.linkOAuthAccount);

/**
 * @swagger
 * /api/auth/oauth/unlink/{provider}:
 *   delete:
 *     summary: Unlink OAuth account from user
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         schema:
 *           type: string
 *           enum: [google, apple]
 *         required: true
 *         description: OAuth provider to unlink
 *     responses:
 *       200:
 *         description: OAuth account unlinked successfully
 *       400:
 *         description: Invalid request or cannot unlink (need at least one auth method)
 */
router.delete('/oauth/unlink/:provider', authenticate, csrfProtection, oauthController.unlinkOAuthAccount);

export default router;

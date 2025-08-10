import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validateBody } from '../middleware/validation';
import { signupSchema, loginSchema } from '../utils/validation';

const router = Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: User registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name (alphabets only with one space between first and last name)
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 description: At least 8 characters with uppercase, lowercase, number and special character
 *               role:
 *                 type: string
 *                 enum: [applicant, company]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post('/signup', validateBody(signupSchema), authController.signup);

// Email verification route removed - users are auto-verified

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email not verified
 */
router.post('/login', validateBody(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/test:
 *   post:
 *     summary: Test authentication (Development only)
 *     tags: [Authentication]
 *     description: Creates/finds a test user and returns a JWT token for testing. Only works in development mode.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *               role:
 *                 type: string
 *                 enum: [applicant, company]
 *                 default: company
 *                 example: company
 *     responses:
 *       200:
 *         description: Test authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Test authentication successful (Development only)
 *                 object:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     instructions:
 *                       type: string
 *                       example: "Use this token in the Authorization header: Bearer <token>"
 *       400:
 *         description: Validation error
 *       404:
 *         description: Endpoint not available in production
 */
router.post('/test', authController.testAuth);

export { router as authRouter };
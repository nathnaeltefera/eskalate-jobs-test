import { Router } from 'express';
import * as jobController from '../controllers/jobController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { jobSchema, jobUpdateSchema } from '../utils/validation';

const router = Router();

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job (Company only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 2000
 *               location:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Draft, Open, Closed]
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/',
  authenticateToken,
  requireRole(['company']),
  validateBody(jobSchema),
  jobController.createJob
);

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Browse jobs with filters and pagination
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filter by job title (case-insensitive substring)
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location (case-insensitive substring)
 *       - in: query
 *         name: company
 *         schema:
 *           type: string
 *         description: Filter by company name (case-insensitive substring)
 *       - in: query
 *         name: pageNumber
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Page size
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, jobController.browseJobs);

/**
 * @swagger
 * /api/jobs/my:
 *   get:
 *     summary: Get my posted jobs (Company only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Open, Closed]
 *         description: Filter by job status
 *       - in: query
 *         name: pageNumber
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Page size
 *     responses:
 *       200:
 *         description: Your jobs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/my', authenticateToken, requireRole(['company']), jobController.getMyJobs);

/**
 * @swagger
 * /api/jobs/{jobId}:
 *   get:
 *     summary: Get job details by ID
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found
 */
router.get('/:jobId', authenticateToken, jobController.getJobById);

/**
 * @swagger
 * /api/jobs/{jobId}:
 *   patch:
 *     summary: Update job (Company only, owner only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 2000
 *               location:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Draft, Open, Closed]
 *     responses:
 *       200:
 *         description: Job updated successfully
 *       400:
 *         description: Validation error or invalid status transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Job not found
 */
router.patch(
  '/:jobId',
  authenticateToken,
  requireRole(['company']),
  validateBody(jobUpdateSchema),
  jobController.updateJob
);

/**
 * @swagger
 * /api/jobs/{jobId}:
 *   delete:
 *     summary: Delete job (Company only, owner only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Job not found
 */
router.delete(
  '/:jobId',
  authenticateToken,
  requireRole(['company']),
  jobController.deleteJob
);

export { router as jobsRouter };
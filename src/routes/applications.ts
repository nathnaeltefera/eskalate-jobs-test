import { Router } from 'express';
import * as applicationController from '../controllers/applicationController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { applicationSchema, statusUpdateSchema } from '../utils/validation';
import { upload } from '../middleware/upload';

const router = Router();

/**
 * @swagger
 * /api/jobs/{jobId}/applications:
 *   post:
 *     summary: Apply for a job (Applicant only)
 *     tags: [Applications]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - resume
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *                 description: Resume file (PDF or DOCX only)
 *               coverLetter:
 *                 type: string
 *                 maxLength: 200
 *                 description: Optional cover letter
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Job not found
 *       409:
 *         description: Already applied to this job
 */
router.post(
  '/jobs/:jobId/applications',
  authenticateToken,
  requireRole(['applicant']),
  upload.single('resume'),
  validateBody(applicationSchema),
  applicationController.applyForJob
);

/**
 * @swagger
 * /api/applications/me:
 *   get:
 *     summary: Track my applications (Applicant only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: company
 *         schema:
 *           type: string
 *         description: Filter by company name
 *       - in: query
 *         name: jobStatus
 *         schema:
 *           type: string
 *           enum: [Open, Closed]
 *         description: Filter by job status
 *       - in: query
 *         name: applicationStatus
 *         schema:
 *           type: string
 *         description: Filter by application status (comma-separated list)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [appliedAt, companyName, applicationStatus, jobTitle]
 *         description: Sort by field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
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
 *         description: Your applications retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get(
  '/applications/me',
  authenticateToken,
  requireRole(['applicant']),
  applicationController.getMyApplications
);

/**
 * @swagger
 * /api/jobs/{jobId}/applications:
 *   get:
 *     summary: View applications for a job (Company only, owner only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Applied, Reviewed, Interview, Rejected, Hired]
 *         description: Filter by application status
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
 *         description: Job applications retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Job not found
 */
router.get(
  '/jobs/:jobId/applications',
  authenticateToken,
  requireRole(['company']),
  applicationController.getJobApplications
);

/**
 * @swagger
 * /api/applications/{applicationId}/status:
 *   patch:
 *     summary: Update application status (Company only, job owner only)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Applied, Reviewed, Interview, Rejected, Hired]
 *     responses:
 *       200:
 *         description: Application status updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Application not found
 */
router.patch(
  '/applications/:applicationId/status',
  authenticateToken,
  requireRole(['company']),
  validateBody(statusUpdateSchema),
  applicationController.updateApplicationStatus
);

export { router as applicationsRouter };
import { Response, NextFunction } from 'express';
import { ApplicationService } from '../services/applicationService';
import { sendBaseResponse, sendPaginatedResponse, sendErrorResponse } from '../utils/response';
import { AuthenticatedRequest, PaginationParams } from '../types';

const applicationService = new ApplicationService();

export const applyForJob = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;
    const userId = req.user!.id;

    if (!req.file) {
      sendErrorResponse(res, 400, 'Resume file is required');
      return;
    }

    const result = await applicationService.applyForJob(
      userId,
      jobId,
      req.file,
      coverLetter
    );

    sendBaseResponse(res, 201, true, 'Application submitted successfully', result);
  } catch (error: any) {
    if (error.message === 'Job not found') {
      sendErrorResponse(res, 404, error.message);
      return;
    }
    if (error.message === 'You have already applied to this job') {
      sendErrorResponse(res, 409, error.message);
      return;
    }
    next(error);
  }
};

export const getMyApplications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      company,
      jobStatus,
      applicationStatus,
      sortBy,
      order,
      pageNumber,
      pageSize,
    } = req.query as {
      company?: string;
      jobStatus?: string;
      applicationStatus?: string;
      sortBy?: string;
      order?: 'asc' | 'desc';
      pageNumber?: string;
      pageSize?: string;
    };

    const filters = {
      company,
      jobStatus,
      applicationStatus: applicationStatus ? applicationStatus.split(',') : undefined,
    };

    const sorting = {
      sortBy,
      order,
    };

    const pagination: PaginationParams = {
      pageNumber: pageNumber ? parseInt(pageNumber) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 10,
    };

    const result = await applicationService.getMyApplications(
      userId,
      filters,
      sorting,
      pagination
    );

    sendPaginatedResponse(
      res,
      200,
      true,
      'Your applications retrieved successfully',
      result.applications,
      result.pageNumber,
      result.pageSize,
      result.totalSize
    );
  } catch (error: any) {
    next(error);
  }
};

export const getJobApplications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const userId = req.user!.id;
    const { status, pageNumber, pageSize } = req.query as {
      status?: string;
      pageNumber?: string;
      pageSize?: string;
    };

    const pagination: PaginationParams = {
      pageNumber: pageNumber ? parseInt(pageNumber) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 10,
    };

    const result = await applicationService.getJobApplications(
      jobId,
      userId,
      status,
      pagination
    );

    sendPaginatedResponse(
      res,
      200,
      true,
      'Job applications retrieved successfully',
      result.applications,
      result.pageNumber,
      result.pageSize,
      result.totalSize
    );
  } catch (error: any) {
    if (error.message === 'Job not found') {
      sendErrorResponse(res, 404, error.message);
      return;
    }
    if (error.message === 'Unauthorized access') {
      sendBaseResponse(res, 403, false, error.message, null);
      return;
    }
    next(error);
  }
};

export const updateApplicationStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;

    const result = await applicationService.updateApplicationStatus(
      applicationId,
      userId,
      status
    );

    sendBaseResponse(res, 200, true, 'Application status updated successfully', result);
  } catch (error: any) {
    if (error.message === 'Application not found') {
      sendErrorResponse(res, 404, error.message);
      return;
    }
    if (error.message === 'Unauthorized') {
      sendBaseResponse(res, 403, false, error.message, null);
      return;
    }
    next(error);
  }
};
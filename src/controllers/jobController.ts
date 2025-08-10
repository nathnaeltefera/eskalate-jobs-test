import { Response, NextFunction } from 'express';
import { JobService } from '../services/jobService';
import { sendBaseResponse, sendPaginatedResponse, sendErrorResponse } from '../utils/response';
import { AuthenticatedRequest, JobData, PaginationParams } from '../types';

const jobService = new JobService();

export const createJob = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const jobData: JobData = req.body;
    const userId = req.user!.id;

    const result = await jobService.createJob(userId, jobData);

    sendBaseResponse(res, 201, true, 'Job created successfully', result);
  } catch (error: any) {
    next(error);
  }
};

export const updateJob = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const jobData: Partial<JobData> = req.body;
    const userId = req.user!.id;

    const result = await jobService.updateJob(jobId, userId, jobData);

    sendBaseResponse(res, 200, true, 'Job updated successfully', result);
  } catch (error: any) {
    if (error.message === 'Job not found') {
      sendErrorResponse(res, 404, error.message);
      return;
    }
    if (error.message === 'Unauthorized access') {
      sendBaseResponse(res, 403, false, error.message, null);
      return;
    }
    if (error.message.includes('Invalid status transition')) {
      sendErrorResponse(res, 400, error.message);
      return;
    }
    next(error);
  }
};

export const deleteJob = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;
    const userId = req.user!.id;

    const result = await jobService.deleteJob(jobId, userId);

    sendBaseResponse(res, 200, true, result.message, null);
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

export const getJobById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { jobId } = req.params;

    const result = await jobService.getJobById(jobId);

    sendBaseResponse(res, 200, true, 'Job retrieved successfully', result);
  } catch (error: any) {
    if (error.message === 'Job not found') {
      sendErrorResponse(res, 404, error.message);
      return;
    }
    next(error);
  }
};

export const browseJobs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, location, company, pageNumber, pageSize } = req.query as {
      title?: string;
      location?: string;
      company?: string;
      pageNumber?: string;
      pageSize?: string;
    };

    const filters = { title, location, company };
    const pagination: PaginationParams = {
      pageNumber: pageNumber ? parseInt(pageNumber) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 10,
    };

    const result = await jobService.browseJobs(filters, pagination);

    sendPaginatedResponse(
      res,
      200,
      true,
      'Jobs retrieved successfully',
      result.jobs,
      result.pageNumber,
      result.pageSize,
      result.totalSize
    );
  } catch (error: any) {
    next(error);
  }
};

export const getMyJobs = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
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

    const result = await jobService.getMyJobs(userId, status, pagination);

    sendPaginatedResponse(
      res,
      200,
      true,
      'Your jobs retrieved successfully',
      result.jobs,
      result.pageNumber,
      result.pageSize,
      result.totalSize
    );
  } catch (error: any) {
    next(error);
  }
};
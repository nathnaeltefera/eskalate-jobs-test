import { prisma } from '../utils/database';
import { JobData, PaginationParams } from '../types';
import { validateStatusTransition } from '../utils/validation';

export class JobService {
  async createJob(userId: string, data: JobData) {
    const { title, description, location, status = 'Draft' } = data;

    const job = await prisma.job.create({
      data: {
        title,
        description,
        location,
        status,
        createdBy: userId,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    return {
      id: job.id,
      title: job.title,
      description: job.description,
      location: job.location,
      status: job.status,
      createdBy: job.createdBy,
      createdAt: job.createdAt,
      creator: job.creator,
      applicationCount: job._count.applications,
    };
  }

  async updateJob(jobId: string, userId: string, data: Partial<JobData>) {
    // Check if job exists and belongs to user
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      throw new Error('Job not found');
    }

    if (existingJob.createdBy !== userId) {
      throw new Error('Unauthorized access');
    }

    // Validate status transition if status is being updated
    if (data.status && !validateStatusTransition(existingJob.status, data.status)) {
      throw new Error('Invalid status transition. Status can only move forward: Draft → Open → Closed');
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data,
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    return {
      id: updatedJob.id,
      title: updatedJob.title,
      description: updatedJob.description,
      location: updatedJob.location,
      status: updatedJob.status,
      createdBy: updatedJob.createdBy,
      createdAt: updatedJob.createdAt,
      creator: updatedJob.creator,
      applicationCount: updatedJob._count.applications,
    };
  }

  async deleteJob(jobId: string, userId: string) {
    // Check if job exists and belongs to user
    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      throw new Error('Job not found');
    }

    if (existingJob.createdBy !== userId) {
      throw new Error('Unauthorized access');
    }

    await prisma.job.delete({
      where: { id: jobId },
    });

    return { message: 'Job deleted successfully' };
  }

  async getJobById(jobId: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return {
      id: job.id,
      title: job.title,
      description: job.description,
      location: job.location,
      status: job.status,
      createdBy: job.createdBy,
      createdAt: job.createdAt,
      creator: job.creator,
      applicationCount: job._count.applications,
    };
  }

  async browseJobs(
    filters: {
      title?: string;
      location?: string;
      company?: string;
    },
    pagination: PaginationParams
  ) {
    const { pageNumber = 1, pageSize = 10 } = pagination;
    const { title, location, company } = filters;

    const skip = (pageNumber - 1) * pageSize;

    const where: any = {};

    if (title) {
      where.title = {
        contains: title,
        mode: 'insensitive',
      };
    }

    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive',
      };
    }

    if (company) {
      where.creator = {
        name: {
          contains: company,
          mode: 'insensitive',
        },
      };
    }

    const [jobs, totalSize] = await prisma.$transaction([
      prisma.job.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { applications: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.job.count({ where }),
    ]);

    const formattedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description,
      location: job.location,
      status: job.status,
      createdBy: job.createdBy,
      createdAt: job.createdAt,
      creator: job.creator,
      applicationCount: job._count.applications,
    }));

    return {
      jobs: formattedJobs,
      totalSize,
      pageNumber,
      pageSize,
    };
  }

  async getMyJobs(
    userId: string,
    statusFilter?: string,
    pagination: PaginationParams = {}
  ) {
    const { pageNumber = 1, pageSize = 10 } = pagination;
    const skip = (pageNumber - 1) * pageSize;

    const where: any = { createdBy: userId };

    if (statusFilter) {
      where.status = statusFilter;
    }

    const [jobs, totalSize] = await prisma.$transaction([
      prisma.job.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          _count: {
            select: { applications: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.job.count({ where }),
    ]);

    const formattedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description,
      location: job.location,
      status: job.status,
      createdBy: job.createdBy,
      createdAt: job.createdAt,
      applicationCount: job._count.applications,
    }));

    return {
      jobs: formattedJobs,
      totalSize,
      pageNumber,
      pageSize,
    };
  }
}
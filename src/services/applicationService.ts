import { prisma } from '../utils/database';
import { uploadResumeToCloudinary } from '../utils/cloudinary';
import { sendApplicationNotification, sendStatusUpdateEmail } from '../utils/email';
import { PaginationParams } from '../types';

export class ApplicationService {
  async applyForJob(
    userId: string,
    jobId: string,
    resumeFile: Express.Multer.File,
    coverLetter?: string
  ) {
    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Check for duplicate application
    const existingApplication = await prisma.application.findUnique({
      where: {
        applicantId_jobId: {
          applicantId: userId,
          jobId,
        },
      },
    });

    if (existingApplication) {
      throw new Error('You have already applied to this job');
    }

    // Upload resume to Cloudinary
    const resumeLink = await uploadResumeToCloudinary(resumeFile);

    // Get applicant info for email notification
    const applicant = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    // Create application
    const application = await prisma.application.create({
      data: {
        applicantId: userId,
        jobId,
        resumeLink,
        coverLetter,
        status: 'Applied',
      },
      include: {
        applicant: {
          select: { id: true, name: true, email: true },
        },
        job: {
          select: { id: true, title: true, description: true, location: true, status: true },
        },
      },
    });

    // Send notification email to company
    await sendApplicationNotification(
      job.creator.email,
      job.title,
      applicant!.name
    );

    return {
      id: application.id,
      applicantId: application.applicantId,
      jobId: application.jobId,
      resumeLink: application.resumeLink,
      coverLetter: application.coverLetter,
      status: application.status,
      appliedAt: application.appliedAt,
      applicant: application.applicant,
      job: application.job,
    };
  }

  async getMyApplications(
    userId: string,
    filters: {
      company?: string;
      jobStatus?: string;
      applicationStatus?: string[];
    },
    sorting: {
      sortBy?: string;
      order?: 'asc' | 'desc';
    },
    pagination: PaginationParams
  ) {
    const { pageNumber = 1, pageSize = 10 } = pagination;
    const { company, jobStatus, applicationStatus } = filters;
    const { sortBy = 'appliedAt', order = 'desc' } = sorting;

    const skip = (pageNumber - 1) * pageSize;

    const where: any = { applicantId: userId };

    if (company) {
      where.job = {
        ...where.job,
        creator: {
          name: {
            contains: company,
            mode: 'insensitive',
          },
        },
      };
    }

    if (jobStatus) {
      where.job = {
        ...where.job,
        status: jobStatus,
      };
    }

    if (applicationStatus && applicationStatus.length > 0) {
      where.status = {
        in: applicationStatus,
      };
    }

    const orderBy: any = {};
    switch (sortBy) {
      case 'appliedAt':
        orderBy.appliedAt = order;
        break;
      case 'companyName':
        orderBy.job = { creator: { name: order } };
        break;
      case 'applicationStatus':
        orderBy.status = order;
        break;
      case 'jobTitle':
        orderBy.job = { title: order };
        break;
      default:
        orderBy.appliedAt = 'desc';
    }

    const [applications, totalSize] = await prisma.$transaction([
      prisma.application.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          job: {
            include: {
              creator: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy,
      }),
      prisma.application.count({ where }),
    ]);

    const formattedApplications = applications.map(app => ({
      id: app.id,
      jobTitle: app.job.title,
      companyName: app.job.creator.name,
      status: app.status,
      appliedAt: app.appliedAt,
      resumeLink: app.resumeLink,
      coverLetter: app.coverLetter,
      job: {
        id: app.job.id,
        title: app.job.title,
        location: app.job.location,
        status: app.job.status,
      },
    }));

    return {
      applications: formattedApplications,
      totalSize,
      pageNumber,
      pageSize,
    };
  }

  async getJobApplications(
    jobId: string,
    userId: string,
    statusFilter?: string,
    pagination: PaginationParams = {}
  ) {
    // Check if job exists and belongs to user
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.createdBy !== userId) {
      throw new Error('Unauthorized access');
    }

    const { pageNumber = 1, pageSize = 10 } = pagination;
    const skip = (pageNumber - 1) * pageSize;

    const where: any = { jobId };

    if (statusFilter) {
      where.status = statusFilter;
    }

    const [applications, totalSize] = await prisma.$transaction([
      prisma.application.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          applicant: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { appliedAt: 'desc' },
      }),
      prisma.application.count({ where }),
    ]);

    const formattedApplications = applications.map(app => ({
      id: app.id,
      applicantName: app.applicant.name,
      resumeLink: app.resumeLink,
      coverLetter: app.coverLetter,
      status: app.status,
      appliedAt: app.appliedAt,
      applicant: app.applicant,
    }));

    return {
      applications: formattedApplications,
      totalSize,
      pageNumber,
      pageSize,
    };
  }

  async updateApplicationStatus(
    applicationId: string,
    userId: string,
    newStatus: string
  ) {
    // Get application with job and applicant info
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            creator: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        applicant: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Check if user owns the job
    if (application.job.createdBy !== userId) {
      throw new Error('Unauthorized');
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status: newStatus as any },
      include: {
        applicant: {
          select: { id: true, name: true, email: true },
        },
        job: {
          select: { id: true, title: true },
        },
      },
    });

    // Send email notification for specific status changes
    if (['Interview', 'Rejected', 'Hired'].includes(newStatus)) {
      await sendStatusUpdateEmail(
        updatedApplication.applicant.email,
        updatedApplication.job.title,
        newStatus
      );
    }

    return {
      id: updatedApplication.id,
      applicantId: updatedApplication.applicantId,
      jobId: updatedApplication.jobId,
      resumeLink: updatedApplication.resumeLink,
      coverLetter: updatedApplication.coverLetter,
      status: updatedApplication.status,
      appliedAt: updatedApplication.appliedAt,
      applicant: updatedApplication.applicant,
      job: updatedApplication.job,
    };
  }
}
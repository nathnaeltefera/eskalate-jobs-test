import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Job Application Management System API',
      version: '1.0.0',
      description: 'A REST API for job application management system where companies can post jobs and applicants can apply',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:8080',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        BaseResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the operation was successful',
            },
            message: {
              type: 'string',
              description: 'Response message',
            },
            object: {
              type: 'object',
              description: 'Response data',
            },
            errors: {
              type: 'array',
              items: {
                type: 'string',
              },
              nullable: true,
              description: 'Array of error messages',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the operation was successful',
            },
            message: {
              type: 'string',
              description: 'Response message',
            },
            object: {
              type: 'array',
              items: {
                type: 'object',
              },
              description: 'Array of response data',
            },
            pageNumber: {
              type: 'integer',
              description: 'Current page number',
            },
            pageSize: {
              type: 'integer',
              description: 'Number of items per page',
            },
            totalSize: {
              type: 'integer',
              description: 'Total number of items',
            },
            errors: {
              type: 'array',
              items: {
                type: 'string',
              },
              nullable: true,
              description: 'Array of error messages',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            name: {
              type: 'string',
              description: 'Full name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address',
            },
            role: {
              type: 'string',
              enum: ['applicant', 'company'],
              description: 'User role',
            },
            emailVerified: {
              type: 'boolean',
              description: 'Email verification status',
            },
          },
        },
        Job: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Job ID',
            },
            title: {
              type: 'string',
              description: 'Job title',
            },
            description: {
              type: 'string',
              description: 'Job description',
            },
            location: {
              type: 'string',
              description: 'Job location',
            },
            status: {
              type: 'string',
              enum: ['Draft', 'Open', 'Closed'],
              description: 'Job status',
            },
            createdBy: {
              type: 'string',
              description: 'Creator user ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            applicationCount: {
              type: 'integer',
              description: 'Number of applications',
            },
          },
        },
        Application: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Application ID',
            },
            applicantId: {
              type: 'string',
              description: 'Applicant user ID',
            },
            jobId: {
              type: 'string',
              description: 'Job ID',
            },
            resumeLink: {
              type: 'string',
              format: 'uri',
              description: 'Cloudinary URL for resume',
            },
            coverLetter: {
              type: 'string',
              description: 'Cover letter text',
            },
            status: {
              type: 'string',
              enum: ['Applied', 'Reviewed', 'Interview', 'Rejected', 'Hired'],
              description: 'Application status',
            },
            appliedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Application timestamp',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and registration endpoints',
      },
      {
        name: 'Jobs',
        description: 'Job management endpoints',
      },
      {
        name: 'Applications',
        description: 'Job application endpoints',
      },
    ],
  },
  apis: [
    './src/routes/*.ts', // Development
    './dist/routes/*.js' // Production
  ], // Path to the API docs
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // Debug middleware to check if swagger routes are being hit
  app.use('/api/docs*', (req, res, next) => {
    console.log(`Swagger route hit: ${req.method} ${req.originalUrl}`);
    next();
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Job Application API Documentation',
  }));

  // Serve swagger.json
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
  
  console.log('✅ Swagger setup completed');
};
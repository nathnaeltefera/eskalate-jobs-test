import Joi from 'joi';

export const signupSchema = Joi.object({
  name: Joi.string()
    .pattern(/^[A-Za-z]+ [A-Za-z]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Name must contain only alphabets with exactly one space between first and last name',
    }),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least 8 characters with uppercase, lowercase, number and special character',
    }),
  role: Joi.string().valid('applicant', 'company').required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const jobSchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  description: Joi.string().min(20).max(2000).required(),
  location: Joi.string().optional(),
  status: Joi.string().valid('Draft', 'Open', 'Closed').optional(),
});

export const jobUpdateSchema = Joi.object({
  title: Joi.string().min(1).max(100).optional(),
  description: Joi.string().min(20).max(2000).optional(),
  location: Joi.string().optional(),
  status: Joi.string().valid('Draft', 'Open', 'Closed').optional(),
});

export const applicationSchema = Joi.object({
  coverLetter: Joi.string().max(200).optional(),
});

export const statusUpdateSchema = Joi.object({
  status: Joi.string().valid('Applied', 'Reviewed', 'Interview', 'Rejected', 'Hired').required(),
});

export const paginationSchema = Joi.object({
  pageNumber: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10),
});

export const validateStatusTransition = (currentStatus: string, newStatus: string): boolean => {
  const statusFlow: Record<string, string[]> = {
    'Draft': ['Open'],
    'Open': ['Closed'],
    'Closed': []
  };
  
  return statusFlow[currentStatus]?.includes(newStatus) || currentStatus === newStatus;
};
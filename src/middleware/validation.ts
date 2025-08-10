import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { sendErrorResponse } from '../utils/response';

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      sendErrorResponse(res, 400, 'Validation error', errors);
      return;
    }
    
    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      sendErrorResponse(res, 400, 'Query validation error', errors);
      return;
    }
    
    req.query = value;
    next();
  };
};
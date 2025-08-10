import { Request, Response, NextFunction } from 'express';
import { sendErrorResponse } from '../utils/response';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  if (error.code === 'P2002') {
    // Prisma unique constraint violation
    sendErrorResponse(res, 409, 'Resource already exists');
    return;
  }

  if (error.code === 'P2025') {
    // Prisma record not found
    sendErrorResponse(res, 404, 'Resource not found');
    return;
  }

  if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      sendErrorResponse(res, 400, 'File too large');
      return;
    }
    sendErrorResponse(res, 400, 'File upload error');
    return;
  }

  sendErrorResponse(res, 500, 'Internal server error');
};
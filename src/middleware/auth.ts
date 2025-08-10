import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JwtPayload } from '../types';
import { sendErrorResponse } from '../utils/response';

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    sendErrorResponse(res, 401, 'Access token is required');
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      email: decoded.email,
    };
    next();
  } catch (error) {
    sendErrorResponse(res, 403, 'Invalid or expired token');
    return;
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendErrorResponse(res, 401, 'Authentication required');
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendErrorResponse(res, 403, 'Insufficient permissions');
      return;
    }

    next();
  };
};
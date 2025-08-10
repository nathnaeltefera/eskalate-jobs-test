import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { sendBaseResponse, sendErrorResponse } from '../utils/response';
import { SignupData, LoginData } from '../types';
import { prisma } from '../utils/database';

const authService = new AuthService();

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const signupData: SignupData = req.body;
    const result = await authService.signup(signupData);
    
    sendBaseResponse(
      res,
      201,
      true,
      'User registered successfully. You can now login immediately.',
      result
    );
  } catch (error: any) {
    if (error.message === 'User already exists with this email') {
      sendErrorResponse(res, 409, error.message);
      return;
    }
    next(error);
  }
};

// Email verification removed - users are auto-verified during signup

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const loginData: LoginData = req.body;
    const result = await authService.login(loginData);
    
    sendBaseResponse(
      res,
      200,
      true,
      'Login successful',
      {
        token: result.token,
        user: result.user,
      }
    );
  } catch (error: any) {
    if (error.message === 'Invalid email or password') {
      sendErrorResponse(res, 401, error.message);
      return;
    }
    // Email verification errors removed
    next(error);
  }
};

// Development only - Quick test authentication
export const testAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (process.env.NODE_ENV === 'production') {
      sendErrorResponse(res, 404, 'Endpoint not found');
      return;
    }

    const { email, role = 'company' } = req.body;
    
    if (!email) {
      sendErrorResponse(res, 400, 'Email is required');
      return;
    }

    // Find or create test user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create test user with auto-verification
      const result = await authService.signup({
        name: 'Test User',
        email,
        password: 'Test123!@#',
        role: role as 'applicant' | 'company',
      });

      // Auto-verify the user
      await prisma.user.update({
        where: { email },
        data: { emailVerified: true },
      });

      user = await prisma.user.findUnique({
        where: { email },
      });
    }

    if (!user) {
      sendErrorResponse(res, 500, 'Failed to create test user');
      return;
    }

    // Generate token directly
    const payload = {
      sub: user.id,
      role: user.role,
      email: user.email,
    };

    const token = (require('jsonwebtoken') as any).sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });

    sendBaseResponse(
      res,
      200,
      true,
      'Test authentication successful (Development only)',
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: true,
        },
        instructions: 'Use this token in the Authorization header: Bearer <token>'
      }
    );
  } catch (error: any) {
    next(error);
  }
};
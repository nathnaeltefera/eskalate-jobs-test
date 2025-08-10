import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { sendBaseResponse, sendErrorResponse } from '../utils/response';
import { SignupData, LoginData } from '../types';

const authService = new AuthService();

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const signupData: SignupData = req.body;
    const result = await authService.signup(signupData);
    
    sendBaseResponse(
      res,
      201,
      true,
      'User registered successfully. Please check your email to verify your account.',
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

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.query as { token: string };
    
    if (!token) {
      sendErrorResponse(res, 400, 'Verification token is required');
      return;
    }

    const result = await authService.verifyEmail(token);
    
    sendBaseResponse(
      res,
      200,
      true,
      result.message,
      result.user
    );
  } catch (error: any) {
    if (error.message.includes('Invalid or malformed token')) {
      sendErrorResponse(res, 400, error.message);
      return;
    }
    if (error.message.includes('expired')) {
      sendErrorResponse(res, 400, error.message);
      return;
    }
    next(error);
  }
};

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
    if (error.message.includes('verify your email')) {
      sendErrorResponse(res, 403, error.message);
      return;
    }
    next(error);
  }
};
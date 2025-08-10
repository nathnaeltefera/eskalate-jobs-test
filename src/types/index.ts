import { Request } from 'express';

export interface BaseResponse<T = any> {
  success: boolean;
  message: string;
  object: T;
  errors?: string[] | null;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  object: T[];
  pageNumber: number;
  pageSize: number;
  totalSize: number;
  errors?: string[] | null;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'applicant' | 'company';
    email: string;
  };
}

export interface JwtPayload {
  sub: string;
  role: 'applicant' | 'company';
  email: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: 'applicant' | 'company';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface JobData {
  title: string;
  description: string;
  location?: string;
  status?: 'Draft' | 'Open' | 'Closed';
}

export interface ApplicationData {
  resumeFile: Express.Multer.File;
  coverLetter?: string;
}

export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
}
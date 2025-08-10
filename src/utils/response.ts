import { Response } from 'express';
import { BaseResponse, PaginatedResponse } from '../types';

export const sendBaseResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  object: T,
  errors: string[] | null = null
): Response<BaseResponse<T>> => {
  return res.status(statusCode).json({
    success,
    message,
    object,
    errors,
  });
};

export const sendPaginatedResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  object: T[],
  pageNumber: number,
  pageSize: number,
  totalSize: number,
  errors: string[] | null = null
): Response<PaginatedResponse<T>> => {
  return res.status(statusCode).json({
    success,
    message,
    object,
    pageNumber,
    pageSize,
    totalSize,
    errors,
  });
};

export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string,
  errors: string[] = []
): Response<BaseResponse<null>> => {
  return sendBaseResponse(res, statusCode, false, message, null, errors);
};
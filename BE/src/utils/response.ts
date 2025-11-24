import { Response } from 'express';
import {
  SuccessCode,
  ErrorCode,
  SuccessMessages,
  ErrorMessages,
  SuccessHttpStatus,
  ErrorHttpStatus,
} from '../constants/statusCodes';

/**
 * Interface cho response thành công
 */
export interface SuccessResponse<T = any> {
  success: true;
  code: SuccessCode;
  message: string;
  data?: T;
  timestamp?: string;
}

/**
 * Interface cho response lỗi
 */
export interface ErrorResponse {
  success: false;
  code: ErrorCode;
  message: string;
  errors?: any[];
  timestamp?: string;
}

/**
 * Tạo response thành công
 */
export const sendSuccess = <T = any>(
  res: Response,
  code: SuccessCode,
  data?: T,
  customMessage?: string
): Response => {
  const response: SuccessResponse<T> = {
    success: true,
    code,
    message: customMessage || SuccessMessages[code],
    data,
    timestamp: new Date().toISOString(),
  };

  return res.status(SuccessHttpStatus[code]).json(response);
};

/**
 * Tạo response lỗi
 */
export const sendError = (
  res: Response,
  code: ErrorCode,
  errors?: any[],
  customMessage?: string
): Response => {
  const response: ErrorResponse = {
    success: false,
    code,
    message: customMessage || ErrorMessages[code],
    errors,
    timestamp: new Date().toISOString(),
  };

  return res.status(ErrorHttpStatus[code]).json(response);
};

/**
 * Tạo response lỗi từ Error object
 */
export const sendErrorFromException = (
  res: Response,
  error: Error | any,
  defaultCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR
): Response => {
  // Nếu error có code property (từ AppError)
  if (error.code && Object.values(ErrorCode).includes(error.code)) {
    return sendError(res, error.code, error.errors, error.message);
  }

  // Xử lý các loại lỗi phổ biến
  if (error.name === 'ValidationError') {
    return sendError(res, ErrorCode.VALIDATION_ERROR, error.errors);
  }

  if (error.name === 'UnauthorizedError') {
    return sendError(res, ErrorCode.UNAUTHORIZED);
  }

  // Lỗi mặc định
  return sendError(res, defaultCode, undefined, error.message);
};


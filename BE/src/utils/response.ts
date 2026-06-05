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
export interface SuccessResponse<T = unknown> {
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
  errors?: unknown[];
  timestamp?: string;
}

/**
 * Tạo response thành công
 */
export const sendSuccess = <T = unknown>(
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
  errors?: unknown[],
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
  error: unknown,
  defaultCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR
): Response => {
  // Nếu error có code property (từ AppError)
  if (error && typeof error === 'object' && 'code' in error) {
    const appErr = error as { code: ErrorCode; errors?: unknown[]; message?: string };
    if (Object.values(ErrorCode).includes(appErr.code)) {
      return sendError(res, appErr.code, appErr.errors, appErr.message);
    }
  }

  // Xử lý các loại lỗi phổ biến
  if (error && typeof error === 'object' && 'name' in error) {
    const namedErr = error as { name: string; errors?: unknown[]; message?: string };
    if (namedErr.name === 'ValidationError') {
      return sendError(res, ErrorCode.VALIDATION_ERROR, namedErr.errors);
    }

    if (namedErr.name === 'UnauthorizedError') {
      return sendError(res, ErrorCode.UNAUTHORIZED);
    }

    // Lỗi mặc định
    return sendError(res, defaultCode, undefined, namedErr.message);
  }

  // Lỗi mặc định
  return sendError(
    res,
    defaultCode,
    undefined,
    error instanceof Error ? error.message : String(error)
  );
};

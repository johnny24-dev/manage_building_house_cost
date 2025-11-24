import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ErrorCode, ErrorMessages, ErrorHttpStatus } from '../constants/statusCodes';

/**
 * Middleware xử lý lỗi tập trung
 * Trả về JSON chuẩn: { message, errorCode }
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let errorCode: ErrorCode;
  let message: string;
  let statusCode: number;

  // Nếu là AppError (lỗi đã được xử lý)
  if (err instanceof AppError) {
    errorCode = err.code;
    message = err.message || ErrorMessages[err.code];
    statusCode = err.statusCode || ErrorHttpStatus[err.code];
  }
  // Xử lý lỗi validation từ express-validator
  else if (err.name === 'ValidationError') {
    errorCode = ErrorCode.VALIDATION_ERROR;
    message = ErrorMessages[ErrorCode.VALIDATION_ERROR];
    statusCode = ErrorHttpStatus[ErrorCode.VALIDATION_ERROR];
  }
  // Xử lý lỗi JSON parse
  else if (err instanceof SyntaxError && 'body' in err) {
    errorCode = ErrorCode.BAD_REQUEST;
    message = ErrorMessages[ErrorCode.BAD_REQUEST];
    statusCode = ErrorHttpStatus[ErrorCode.BAD_REQUEST];
  }
  // Lỗi không xác định
  else {
    console.error('Unhandled error:', err);
    errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
    message = process.env.NODE_ENV === 'production' 
      ? ErrorMessages[ErrorCode.INTERNAL_SERVER_ERROR]
      : err.message || ErrorMessages[ErrorCode.INTERNAL_SERVER_ERROR];
    statusCode = ErrorHttpStatus[ErrorCode.INTERNAL_SERVER_ERROR];
  }

  // Trả về JSON chuẩn: { message, errorCode }
  return res.status(statusCode).json({
    message,
    errorCode,
  });
};

/**
 * Middleware bắt các route không tồn tại
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new AppError(
    ErrorCode.NOT_FOUND,
    `Route ${req.method} ${req.originalUrl} không tồn tại`
  );
  next(error);
};


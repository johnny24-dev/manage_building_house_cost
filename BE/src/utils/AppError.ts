import { ErrorCode, ErrorHttpStatus, ErrorMessages } from '../constants/statusCodes';

/**
 * Custom Error class với mã lỗi
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly errors?: any[];

  constructor(
    code: ErrorCode,
    message?: string,
    errors?: any[]
  ) {
    super(message || ErrorMessages[code]);
    this.name = 'AppError';
    this.code = code;
    this.errors = errors;
    this.statusCode = ErrorHttpStatus[code];

    // Giữ nguyên stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}


/**
 * Mã thành công
 */
export enum SuccessCode {
  // Thành công chung
  SUCCESS = 'SUCCESS',
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
  
  // Authentication & Authorization
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGOUT_SUCCESS = 'LOGOUT_SUCCESS',
  REGISTER_SUCCESS = 'REGISTER_SUCCESS',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
  TOKEN_REFRESHED = 'TOKEN_REFRESHED',
  
  // User
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_FOUND = 'USER_FOUND',
  
  // Data
  DATA_RETRIEVED = 'DATA_RETRIEVED',
  DATA_CREATED = 'DATA_CREATED',
  DATA_UPDATED = 'DATA_UPDATED',
  DATA_DELETED = 'DATA_DELETED',
}

/**
 * Mã lỗi
 */
export enum ErrorCode {
  // Lỗi chung
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Authentication & Authorization
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_FOUND = 'EMAIL_NOT_FOUND',
  PASSWORD_INCORRECT = 'PASSWORD_INCORRECT',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_MISSING = 'TOKEN_MISSING',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  
  // Validation
  EMAIL_INVALID = 'EMAIL_INVALID',
  EMAIL_REQUIRED = 'EMAIL_REQUIRED',
  PASSWORD_REQUIRED = 'PASSWORD_REQUIRED',
  PASSWORD_TOO_SHORT = 'PASSWORD_TOO_SHORT',
  PASSWORD_TOO_LONG = 'PASSWORD_TOO_LONG',
  PASSWORD_WEAK = 'PASSWORD_WEAK',
  FIELD_REQUIRED = 'FIELD_REQUIRED',
  FIELD_INVALID = 'FIELD_INVALID',
  
  // User
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  USER_CREATE_FAILED = 'USER_CREATE_FAILED',
  USER_UPDATE_FAILED = 'USER_UPDATE_FAILED',
  USER_DELETE_FAILED = 'USER_DELETE_FAILED',
  
  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  QUERY_FAILED = 'QUERY_FAILED',
  
  // File & Upload
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_TYPE_INVALID = 'FILE_TYPE_INVALID',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  
  // Rate Limiting
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // Business Logic
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  RESOURCE_EXISTS = 'RESOURCE_EXISTS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
}

/**
 * Thông điệp tương ứng với mã thành công
 */
export const SuccessMessages: Record<SuccessCode, string> = {
  [SuccessCode.SUCCESS]: 'Thành công',
  [SuccessCode.CREATED]: 'Tạo mới thành công',
  [SuccessCode.UPDATED]: 'Cập nhật thành công',
  [SuccessCode.DELETED]: 'Xóa thành công',
  [SuccessCode.LOGIN_SUCCESS]: 'Đăng nhập thành công',
  [SuccessCode.LOGOUT_SUCCESS]: 'Đăng xuất thành công',
  [SuccessCode.REGISTER_SUCCESS]: 'Đăng ký thành công',
  [SuccessCode.PASSWORD_RESET_SUCCESS]: 'Đặt lại mật khẩu thành công',
  [SuccessCode.TOKEN_REFRESHED]: 'Làm mới token thành công',
  [SuccessCode.USER_CREATED]: 'Tạo người dùng thành công',
  [SuccessCode.USER_UPDATED]: 'Cập nhật người dùng thành công',
  [SuccessCode.USER_DELETED]: 'Xóa người dùng thành công',
  [SuccessCode.USER_FOUND]: 'Tìm thấy người dùng',
  [SuccessCode.DATA_RETRIEVED]: 'Lấy dữ liệu thành công',
  [SuccessCode.DATA_CREATED]: 'Tạo dữ liệu thành công',
  [SuccessCode.DATA_UPDATED]: 'Cập nhật dữ liệu thành công',
  [SuccessCode.DATA_DELETED]: 'Xóa dữ liệu thành công',
};

/**
 * Thông điệp tương ứng với mã lỗi
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Lỗi máy chủ nội bộ',
  [ErrorCode.BAD_REQUEST]: 'Yêu cầu không hợp lệ',
  [ErrorCode.UNAUTHORIZED]: 'Không được phép truy cập',
  [ErrorCode.FORBIDDEN]: 'Bị cấm truy cập',
  [ErrorCode.NOT_FOUND]: 'Không tìm thấy',
  [ErrorCode.CONFLICT]: 'Xung đột dữ liệu',
  [ErrorCode.VALIDATION_ERROR]: 'Lỗi xác thực dữ liệu',
  [ErrorCode.INVALID_CREDENTIALS]: 'Email hoặc mật khẩu không đúng',
  [ErrorCode.EMAIL_NOT_FOUND]: 'Email không tồn tại',
  [ErrorCode.PASSWORD_INCORRECT]: 'Mật khẩu không đúng',
  [ErrorCode.TOKEN_INVALID]: 'Token không hợp lệ',
  [ErrorCode.TOKEN_EXPIRED]: 'Token đã hết hạn',
  [ErrorCode.TOKEN_MISSING]: 'Thiếu token xác thực',
  [ErrorCode.ACCOUNT_LOCKED]: 'Tài khoản đã bị khóa',
  [ErrorCode.ACCOUNT_DISABLED]: 'Tài khoản đã bị vô hiệu hóa',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'Email đã tồn tại',
  [ErrorCode.UNAUTHORIZED_ACCESS]: 'Không có quyền truy cập',
  [ErrorCode.EMAIL_INVALID]: 'Email không hợp lệ',
  [ErrorCode.EMAIL_REQUIRED]: 'Email là bắt buộc',
  [ErrorCode.PASSWORD_REQUIRED]: 'Mật khẩu là bắt buộc',
  [ErrorCode.PASSWORD_TOO_SHORT]: 'Mật khẩu quá ngắn',
  [ErrorCode.PASSWORD_TOO_LONG]: 'Mật khẩu quá dài',
  [ErrorCode.PASSWORD_WEAK]: 'Mật khẩu quá yếu',
  [ErrorCode.FIELD_REQUIRED]: 'Trường này là bắt buộc',
  [ErrorCode.FIELD_INVALID]: 'Trường này không hợp lệ',
  [ErrorCode.USER_NOT_FOUND]: 'Không tìm thấy người dùng',
  [ErrorCode.USER_ALREADY_EXISTS]: 'Người dùng đã tồn tại',
  [ErrorCode.USER_CREATE_FAILED]: 'Tạo người dùng thất bại',
  [ErrorCode.USER_UPDATE_FAILED]: 'Cập nhật người dùng thất bại',
  [ErrorCode.USER_DELETE_FAILED]: 'Xóa người dùng thất bại',
  [ErrorCode.DATABASE_ERROR]: 'Lỗi cơ sở dữ liệu',
  [ErrorCode.DATABASE_CONNECTION_ERROR]: 'Lỗi kết nối cơ sở dữ liệu',
  [ErrorCode.QUERY_FAILED]: 'Truy vấn thất bại',
  [ErrorCode.FILE_TOO_LARGE]: 'File quá lớn',
  [ErrorCode.FILE_TYPE_INVALID]: 'Loại file không hợp lệ',
  [ErrorCode.FILE_UPLOAD_FAILED]: 'Tải file lên thất bại',
  [ErrorCode.FILE_NOT_FOUND]: 'Không tìm thấy file',
  [ErrorCode.TOO_MANY_REQUESTS]: 'Quá nhiều yêu cầu',
  [ErrorCode.OPERATION_NOT_ALLOWED]: 'Thao tác không được phép',
  [ErrorCode.RESOURCE_EXISTS]: 'Tài nguyên đã tồn tại',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Không tìm thấy tài nguyên',
};

/**
 * HTTP Status Code tương ứng với mã lỗi
 */
export const ErrorHttpStatus: Record<ErrorCode, number> = {
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.EMAIL_NOT_FOUND]: 404,
  [ErrorCode.PASSWORD_INCORRECT]: 401,
  [ErrorCode.TOKEN_INVALID]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.TOKEN_MISSING]: 401,
  [ErrorCode.ACCOUNT_LOCKED]: 403,
  [ErrorCode.ACCOUNT_DISABLED]: 403,
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 409,
  [ErrorCode.UNAUTHORIZED_ACCESS]: 403,
  [ErrorCode.EMAIL_INVALID]: 400,
  [ErrorCode.EMAIL_REQUIRED]: 400,
  [ErrorCode.PASSWORD_REQUIRED]: 400,
  [ErrorCode.PASSWORD_TOO_SHORT]: 400,
  [ErrorCode.PASSWORD_TOO_LONG]: 400,
  [ErrorCode.PASSWORD_WEAK]: 400,
  [ErrorCode.FIELD_REQUIRED]: 400,
  [ErrorCode.FIELD_INVALID]: 400,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.USER_ALREADY_EXISTS]: 409,
  [ErrorCode.USER_CREATE_FAILED]: 500,
  [ErrorCode.USER_UPDATE_FAILED]: 500,
  [ErrorCode.USER_DELETE_FAILED]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.DATABASE_CONNECTION_ERROR]: 500,
  [ErrorCode.QUERY_FAILED]: 500,
  [ErrorCode.FILE_TOO_LARGE]: 413,
  [ErrorCode.FILE_TYPE_INVALID]: 400,
  [ErrorCode.FILE_UPLOAD_FAILED]: 500,
  [ErrorCode.FILE_NOT_FOUND]: 404,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,
  [ErrorCode.OPERATION_NOT_ALLOWED]: 403,
  [ErrorCode.RESOURCE_EXISTS]: 409,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
};

/**
 * HTTP Status Code tương ứng với mã thành công
 */
export const SuccessHttpStatus: Record<SuccessCode, number> = {
  [SuccessCode.SUCCESS]: 200,
  [SuccessCode.CREATED]: 201,
  [SuccessCode.UPDATED]: 200,
  [SuccessCode.DELETED]: 200,
  [SuccessCode.LOGIN_SUCCESS]: 200,
  [SuccessCode.LOGOUT_SUCCESS]: 200,
  [SuccessCode.REGISTER_SUCCESS]: 201,
  [SuccessCode.PASSWORD_RESET_SUCCESS]: 200,
  [SuccessCode.TOKEN_REFRESHED]: 200,
  [SuccessCode.USER_CREATED]: 201,
  [SuccessCode.USER_UPDATED]: 200,
  [SuccessCode.USER_DELETED]: 200,
  [SuccessCode.USER_FOUND]: 200,
  [SuccessCode.DATA_RETRIEVED]: 200,
  [SuccessCode.DATA_CREATED]: 201,
  [SuccessCode.DATA_UPDATED]: 200,
  [SuccessCode.DATA_DELETED]: 200,
};


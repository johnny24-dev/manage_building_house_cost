import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants/statusCodes';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User.entity';

// Extend Express Request để thêm user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Middleware xác thực JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(ErrorCode.TOKEN_MISSING);
    }

    const token = authHeader.substring(7); // Bỏ "Bearer "

    // Verify token
    const decoded = verifyToken(token);

    // Lấy thông tin user từ database để có role
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new AppError(ErrorCode.TOKEN_INVALID);
    }

    // Gán user vào request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(ErrorCode.TOKEN_INVALID));
    }
  }
};

/**
 * Middleware xác thực JWT token (optional - không bắt buộc)
 * Cho phép truy cập với hoặc không có token
 */
export const authenticateOptional = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Lấy token từ header hoặc query parameter
    const authHeader = req.headers.authorization;
    const tokenFromQuery = req.query.token as string | undefined;
    
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : tokenFromQuery;

    if (token) {
      try {
        // Verify token nếu có
        const decoded = verifyToken(token);

        // Lấy thông tin user từ database
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
          where: { id: decoded.userId },
        });

        if (user) {
          // Gán user vào request nếu token hợp lệ
          req.user = {
            userId: user.id,
            email: user.email,
            role: user.role,
          };
        }
      } catch (error) {
        // Token không hợp lệ nhưng vẫn cho phép truy cập (không có user)
        console.warn('Invalid token in optional auth:', error);
      }
    }

    next();
  } catch (error) {
    // Nếu có lỗi, vẫn cho phép tiếp tục (không có user)
    next();
  }
};

/**
 * Middleware kiểm tra quyền super admin
 */
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== UserRole.SUPER_ADMIN) {
    return next(new AppError(ErrorCode.FORBIDDEN, 'Chỉ super admin mới có quyền thực hiện thao tác này'));
  }
  next();
};

